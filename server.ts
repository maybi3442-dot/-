import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  initServerStorage,
  getAllData,
  getSessions,
  saveSession,
  deleteSession,
  updateSessionMeta,
  getBurnoutHistory,
  saveBurnoutRecord,
  deleteBurnoutRecord,
  getTeacherDiary,
  saveDiaryEntry,
  deleteDiaryEntry,
  getLatestAnalysis,
  saveLatestAnalysis,
  STRESS_CATEGORIES,
  classifyTextToCategory,
  StressCategory,
  TeacherStressAnalysis,
} from './src/server-storage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient Gemini API caller with model fallback (gemini-2.5-flash -> gemini-3.8-flash)
async function callGeminiWithFallback(options: {
  contents: any;
  config?: any;
}) {
  const models = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return response;
    } catch (err: any) {
      console.warn(`[Gemini API] Model ${model} encountered issue (${err?.status || err?.message}), attempting next model.`);
      lastError = err;
    }
  }

  throw lastError;
}

// Local algorithmic stress diagnosis fallback for high resilience when LLM is under high demand (503)
function synthesizeDiagnosisLocally(sessions: any[]): TeacherStressAnalysis {
  const scores: Record<StressCategory, number> = {
    parent_complaint: 0,
    admin_work: 0,
    classroom_instruction: 0,
    emotional_burnout: 0,
  };

  const allTriggers: string[] = [];
  const allKeywords: string[] = [];

  sessions.forEach((s) => {
    const cat: StressCategory = s.category || 'parent_complaint';
    if (scores[cat] !== undefined) {
      scores[cat] += (s.stressIntensity || 3);
    }
    if (Array.isArray(s.detectedKeywords)) {
      s.detectedKeywords.forEach((k: string) => {
        if (!allKeywords.includes(k)) allKeywords.push(k);
      });
    }
  });

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const categoriesKeys = Object.keys(scores) as StressCategory[];
  let maxCat: StressCategory = 'parent_complaint';
  let maxScore = -1;

  categoriesKeys.forEach((cat) => {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      maxCat = cat;
    }
  });

  const categoryDistribution: Record<StressCategory, { count: number; percentage: number; name: string }> = {
    parent_complaint: {
      count: sessions.filter((s) => s.category === 'parent_complaint').length,
      percentage: Math.max(10, Math.round((scores.parent_complaint / totalScore) * 100)),
      name: '학부모 민원 및 교권',
    },
    admin_work: {
      count: sessions.filter((s) => s.category === 'admin_work').length,
      percentage: Math.max(10, Math.round((scores.admin_work / totalScore) * 100)),
      name: '행정 업무 및 잡무',
    },
    classroom_instruction: {
      count: sessions.filter((s) => s.category === 'classroom_instruction').length,
      percentage: Math.max(10, Math.round((scores.classroom_instruction / totalScore) * 100)),
      name: '수업 및 생활지도',
    },
    emotional_burnout: {
      count: sessions.filter((s) => s.category === 'emotional_burnout').length,
      percentage: Math.max(10, Math.round((scores.emotional_burnout / totalScore) * 100)),
      name: '정서 소진 및 자책',
    },
  };

  const primaryCategoryName = STRESS_CATEGORIES[maxCat]?.name || '학부모 민원 및 교권 침해';

  const dynamicDiagnoses: Record<StressCategory, { diagnosis: string; strategy: string; actions: Array<{ title: string; description: string; targetCategory: string }> }> = {
    parent_complaint: {
      diagnosis: '선생님의 누적 대화 분석 결과, 학부모의 부당한 요구나 퇴근 후 연락 등 거친 감정적 항의로 인해 심리적 안정감이 가장 크게 위협받고 있습니다. 퇴근 후에도 연락에 대한 불안으로 뇌가 이완되지 못하는 과각성 상태가 관찰됩니다.',
      strategy: '학부모 응대 시 "선생님 잘못이 아님"을 최우선으로 확립하고, 개인 연락처 대신 교원 안심번호 및 학교 공식 소통 채널만을 사용하도록 단호히 가이드할 것.',
      actions: [
        { title: '퇴근 후 알림 완벽 차단', description: '18시 이후 교원 안심번호 앱 자동 응답 모드 활성화 및 메신저 알림 끄기', targetCategory: '민원·교권' },
        { title: '공식 소통 템플릿 사용', description: '감정적인 즉답을 피하고 "안심 대응 문구"를 활용하여 정중하게 원칙 전달', targetCategory: '민원·교권' },
        { title: '관리자 사전 공유 체계화', description: '악성 민원 징후가 있을 시 교감/학년부장에게 즉시 구두 공유하여 혼자 방어하지 않기', targetCategory: '민원·교권' },
      ],
    },
    admin_work: {
      diagnosis: '끝없는 교육청 공문, 나이스 오류 처리, 행사성 잡무로 인해 "내가 교사인지 행정 사무원인지 모르겠다"는 본질적 회의감과 시간 부족 스트레스가 가장 높게 나타납니다.',
      strategy: '공문과 행정은 100점 만점이 아닌 "80점의 신속성"으로 털어내도록 안내하고, 수업과 내 쉼을 위한 최소한의 에너지를 비축하도록 격려할 것.',
      actions: [
        { title: '행정 업무 80% 완성도 원칙', description: '공문은 기한 내 결재에 초점을 맞추고 완벽주의 내려놓기', targetCategory: '행정·업무' },
        { title: '하루 30분 무방해 집중 시간', description: '출근 직후 공문 처리 시간을 블록으로 지정하여 잡무 분산 방지', targetCategory: '행정·업무' },
        { title: '동료 교사 양식 적극 공유', description: '새로운 기안 작성 시 전년도 문서나 옆 반 선생님 양식 재활용하기', targetCategory: '행정·업무' },
      ],
    },
    classroom_instruction: {
      diagnosis: '수업 방해 학생의 돌발 행동과 다른 학생들에 대한 미안함, 그리고 교실 내 통제력 상실에 대한 불안이 주된 스트레스 원인으로 분석됩니다.',
      strategy: '수업 방해는 교사의 지도력 부족이 아님을 확인시키고, 담임교사 혼자 해결하려 하지 말고 Wee클래스 및 학년 협의체를 통한 분리 지도를 유도할 것.',
      actions: [
        { title: '교실 내 1인 타임아웃 좌석 지정', description: '돌발 행동 시 감정적 충돌을 피하고 잠시 숨을 고를 수 있는 공간 마련', targetCategory: '수업·생활지도' },
        { title: 'Wee클래스 전문상담 연계', description: '반복적인 문제 행동 학생은 전문상담교사와 연계하여 담임 부담 경감', targetCategory: '수업·생활지도' },
        { title: '작은 규칙 한 가지 지키기 칭찬', description: '전체 통제보다 오늘 잘 따라와 준 아이들에게 따뜻한 눈빛 보내기', targetCategory: '수업·생활지도' },
      ],
    },
    emotional_burnout: {
      diagnosis: '타 교사와의 비교, "내가 교사 자격이 있나"라는 무거운 자책감과 깊은 정서적 소진이 감지됩니다. 높은 이상과 책임감이 오히려 스스로를 갉아먹는 원인이 되고 있습니다.',
      strategy: '자기비하를 따뜻하게 걷어내고, "아이들을 걱정하는 그 마음 자체가 이미 좋은 교사"임을 지속적으로 지지해줄 것.',
      actions: [
        { title: '비교 멈추고 오늘 나 칭찬하기', description: '남의 교실 겉모습과 내 교실 속사정을 비교하지 않기', targetCategory: '정서소진·관계' },
        { title: '퇴근 의식: 교실 문 닫기', description: '퇴근하는 순간 오늘 학교의 무거운 생각들을 의식적으로 학교에 남겨두기', targetCategory: '정서소진·관계' },
        { title: '하루 5분 온전한 나만의 쉼', description: '4-7-8 이완 호흡이나 따뜻한 차 한 잔으로 긴장된 어깨 풀기', targetCategory: '정서소진·관계' },
      ],
    },
  };

  const targetPack = dynamicDiagnoses[maxCat];

  return {
    analyzedAt: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    totalConversations: sessions.length,
    primaryStressCategory: maxCat,
    primaryCategoryName,
    categoryDistribution,
    stressTrend: `${primaryCategoryName} 영역에서 가장 빈번한 긴장과 에너지 소진이 관측됩니다.`,
    recurringTriggers: allKeywords.slice(0, 4).length > 0 ? allKeywords.slice(0, 4) : ['퇴근 후 연락', '수업 중 소음', '공문 마감', '자리배치 요구'],
    emotionalKeywords: ['심장 두근거림', '자책감', '불안', '회의감'],
    aiComprehensiveDiagnosis: targetPack.diagnosis,
    tailoredCounselingStrategy: targetPack.strategy,
    recommendedActions: targetPack.actions,
  };
}

const COUNSELOR_PROMPTS: Record<string, string> = {
  senior_mentor: `당신은 대한민국 초·중·고등학교에서 15년 이상 아이들을 지도해 온 온화하고 지혜로운 수석교사 '라온 쌤'입니다.
상담을 요청하는 사용자는 과중한 업무, 문제 행동을 보이는 학생, 까다롭거나 거친 학부모 민원, 행정 잡무 등으로 몸과 마음이 지쳐있는 현직 교사입니다.

[상담 지침]
1. 말투: 매우 따뜻하고 다정하며, 공감과 존중이 가득한 어조("선생님, 오늘 정말 고생 많으셨어요...", "선생님의 그 마음, 제가 너무나 잘 압니다")를 일관되게 유지합니다.
2. 태도: "선생님 잘못이 아니에요."라는 무조건적인 지지와 수용을 먼저 제공합니다. 교사들이 흔히 겪는 '자책감', '내가 부족해서 아이가 이러나', '내가 교사 자격이 없나'라는 자기비하를 부드럽게 걷어내 줍니다.
3. 현실적 통찰: 공감 후, 학교 현장에서 실제로 도움이 되는 교실 경영 마인드셋이나 "잠시 거리를 두고 깊게 숨을 고르는 법", "퇴근 후에는 교실 문을 닫듯 마음을 닫는 방법" 등을 선배의 경험담처럼 들려주세요.
4. 절대 조언을 훈계하듯 나열하지 말고, 진심으로 안아주듯 한두 가지의 명확하고 따뜻한 위로와 실천 팁을 주세요.
5. 극심한 우울이나 극단적 선택 언급 시에는 따뜻한 지지와 함께 전문 교원치유지원센터(지역 교육청) 및 핫라인(109 / 1393)을 반드시 정중하게 안내해주세요.`,

  psychologist: `당신은 교사 전문 심리치료사이자 번아웃 회복 전문가 '소원 상담사'입니다.
교직 현장의 특수성(감정 노동, 높은 도덕적 기대치, 과각성 상태, 심리적 소진)을 깊이 이해하고 있습니다.

[상담 지침]
1. 말투: 차분하고 안정적이며, 마음을 편안하게 이완시켜주는 치유적 어조("선생님, 지금 가슴이 답답하거나 어깨가 긴장되어 있지 않으신가요?")를 사용합니다.
2. 접근법: 감정 명명(Emotion Labeling)과 수용전념(Acceptance), 자기자비(Self-Compassion) 기법을 활용합니다. 무력감, 분노, 슬픔, 불안을 억누르지 않고 "선생님이 느끼시는 감정은 그 상황에서 너무나 자연스럽고 마땅한 반응입니다"라고 정당화해줍니다.
3. 이완 기법: 필요할 때 3초 호흡법, 신체 그라운딩(발바닥 감각 느끼기), 감정 흘려보내기 등 일상에서 바로 할 수 있는 작은 심리 기술을 하나씩 안내합니다.
4. 질문을 통해 선생님이 자신의 잃어버린 에너지를 점검하고 자기를 먼저 돌볼 수 있도록 돕습니다.`,

  rights_guardian: `당신은 교권 보호 및 학부모·학생 갈등 해결 전문 멘토 '한결 멘토'입니다.
선생님이 악성 민원, 부당한 간섭, 폭언, 아동학대 의심 신고 위협, 학생 간 학교폭력 갈등 등으로 극심한 공포와 불안을 겪을 때 든든한 방패가 되어줍니다.

[상담 지침]
1. 말투: 든든하고 명확하며, 침착하고 든든한 신뢰감을 주는 어조("선생님, 혼자가 아닙니다. 당황하지 마시고 원칙대로 하나씩 풀어나가면 됩니다")를 사용합니다.
2. 핵심 전략:
   - 교사의 감정적 소모를 즉각 차단: "선생님이 학부모의 감정 쓰레기통이 될 이유는 전혀 없습니다."
   - 공식적 절차 권고: 교내 교권보호위원회 절차, 관리자(교감·교장) 보고 요령, 통화 녹음(합법적 상담기록), 공문 및 교원 안심번호 활용.
   - 단호하고 정중한 대화 가이드: 상대의 억지에 휘둘리지 않고 규정과 법적 테두리 안에서 답변하는 문장 예시 제공.
3. 교사가 죄책감이나 공포에 사로잡히지 않고 객관적이고 당당하게 상황을 통제할 수 있도록 심리적 안정과 법률/매뉴얼 상식 기반의 가이드를 제공합니다.`
};

// 1. Multi-turn Chat API
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { counselorId = 'senior_mentor', messages = [], teacherContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '대화 메시지가 없습니다.' });
    }

    const systemInstruction = COUNSELOR_PROMPTS[counselorId] || COUNSELOR_PROMPTS.senior_mentor;
    
    let contextAddition = '';
    if (teacherContext) {
      const parts = [];
      if (teacherContext.schoolLevel) parts.push(`학교급: ${teacherContext.schoolLevel}`);
      if (teacherContext.yearsOfService) parts.push(`경력: ${teacherContext.yearsOfService}`);
      if (teacherContext.roleType) parts.push(`담당: ${teacherContext.roleType}`);
      if (parts.length > 0) {
        contextAddition = `\n[내담자 정보: ${parts.join(', ')}]`;
      }
    }

    // Inject teacher's accumulated stress analysis data to personalize counselor responses
    const latestAnalysis = await getLatestAnalysis();
    if (latestAnalysis) {
      const primaryCat = latestAnalysis.primaryCategoryName;
      const primaryPct = latestAnalysis.categoryDistribution[latestAnalysis.primaryStressCategory]?.percentage || 35;
      contextAddition += `\n[선생님 누적 대화 기반 심층 스트레스 분석 데이터]
- 최다 스트레스 취약 분야: ${primaryCat} (${primaryPct}%)
- 반복되는 스트레스 자극원(Triggers): ${latestAnalysis.recurringTriggers.slice(0, 4).join(', ')}
- 감정 키워드: ${latestAnalysis.emotionalKeywords.slice(0, 4).join(', ')}
- AI 권장 상담 접근법: ${latestAnalysis.tailoredCounselingStrategy}
[상담사 특별 지침]: 위 분석 결과에 따라 선생님이 현재 '${primaryCat}' 영역에서 가장 많은 에너지를 빼앗기고 있음을 반드시 배려하세요. 자책감을 덜어주고, 혼자 고립되지 않도록 지지하며, 상황에 맞는 실질적인 대처와 마인드셋을 따뜻하게 조언해 주세요.`;
    }

    // Format contents for @google/genai
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await callGeminiWithFallback({
      contents,
      config: {
        systemInstruction: systemInstruction + contextAddition,
        temperature: 0.75,
      },
    });

    const replyText = response.text || '선생님, 제 마음에 귀 기울이고 있습니다. 다시 한 번 말씀해 주시겠어요?';

    return res.json({
      role: 'model',
      text: replyText,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      error: '상담 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      details: error?.message,
    });
  }
});

// 2. Teacher Safe Communication Draft Generator (학부모/학생 안심 대응 문구 생성)
app.post('/api/generate-response', async (req: Request, res: Response) => {
  try {
    const { situationType, details, tone = 'firm_polite' } = req.body;

    const toneInstructions: Record<string, string> = {
      firm_polite: '단호하면서도 매우 정중한 태도 (교원의 권리와 원칙을 명확히 밝히되 예의를 잃지 않는 어조)',
      warm_empathetic: '따뜻하고 공감하는 태도 (학부모의 걱정을 충분히 헤아리되 학교 지침을 안내하는 어조)',
      objective_official: '객관적이고 행정적으로 명료한 태도 (사실 관계와 교육청 지침 중심)',
    };

    const prompt = `당신은 대한민국 교권 보호 및 교육 현장 소통 전문가입니다.
지친 선생님이 학부모 또는 학생과의 어려운 소통 상황에서 상처받지 않고, 교권을 지키며 정중하게 소통할 수 있도록 공식 답변 문구와 조언을 작성해주세요.

[상황 유형]: ${situationType}
[상황 세부 내용]: ${details || '상황 설명 없음'}
[원하는 어조]: ${toneInstructions[tone] || toneInstructions.firm_polite}

반드시 아래 JSON 형식으로만 응답해주세요:
\`\`\`json
{
  "title": "상황에 맞는 답변 제목",
  "draft": "선생님이 그대로 복사하여 문자/알림장/메신저로 전송할 수 있는 완성형 문장 (안녕하세요, 학부모님... 형식)",
  "pointExplanation": "이 문구가 교사를 보호하고 감정 싸움을 줄이는 핵심 이유 2~3줄",
  "teacherAdvice": "선생님 본인의 마음을 지키기 위한 현실적인 마인드셋 조언 2줄"
}
\`\`\``;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Response Generator Error:', error);
    return res.status(500).json({
      error: '답변 문구 생성 중 문제가 발생했습니다.',
      details: error?.message,
    });
  }
});

// 3. Burnout Analysis & Comfort Letter Prescribe (번아웃 처방 & 위로 편지)
app.post('/api/burnout-prescribe', async (req: Request, res: Response) => {
  try {
    const { score, level, categoryScores, answers } = req.body;

    const prompt = `당신은 교사들의 마음을 치유하는 따뜻한 심리치료사이자 동료 교사입니다.
선생님이 실시한 교사 소진(번아웃) 진단 결과를 바탕으로, 죄책감을 덜어주고 마음에 쉼을 주는 따뜻한 '맞춤 처방 편지'와 3가지 소소한 실천 처방을 작성해주세요.

[진단 결과]:
- 총점: ${score}점 (단계: ${level})
- 정서적 고갈: ${categoryScores?.exhaustion || 0}점
- 탈인격화(거리두기): ${categoryScores?.depersonalization || 0}점
- 개인 성취감 저하: ${categoryScores?.reducedAchievement || 0}점

선생님에게 "선생님이 부족해서가 아니라, 그동안 너무 혼자서 많은 짐을 지탱해왔기 때문"이라는 진심 어린 위로를 담아주세요.

반드시 아래 JSON 형식으로만 응답해주세요:
\`\`\`json
{
  "letterTitle": "편지 제목 (예: 선생님, 그동안 참 무거운 짐을 혼자 들고 계셨네요)",
  "warmLetter": "선생님을 향한 다정하고 진솔한 3단락 이상의 위로 편지 전문 (경어체, 깊은 공감)",
  "prescriptions": [
    {
      "title": "처방 1 제목",
      "action": "오늘 당장 실천할 수 있는 1분 이완이나 생활 속 경계선 설정 요령"
    },
    {
      "title": "처방 2 제목",
      "action": "심리적 죄책감을 내려놓는 마음 연습"
    },
    {
      "title": "처방 3 제목",
      "action": "선생님만을 위한 퇴근 후 충전 루틴"
    }
  ],
  "comfortQuote": "선생님을 위한 오늘의 마법 같은 응원 한마디"
}
\`\`\``;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Burnout Prescribe Error:', error);
    return res.status(500).json({
      error: '처방 편지 생성 중 문제가 발생했습니다.',
      details: error?.message,
    });
  }
});

// ==========================================
// 4. Backend Server Data Management REST API
// ==========================================

// Get all counseling records, history, and stats
app.get('/api/records/all', async (_req: Request, res: Response) => {
  try {
    const data = await getAllData();
    const totalMessages = data.sessions.reduce((acc, s) => acc + (s.messages?.length || 0), 0);

    const stats = {
      totalSessions: data.sessions.length,
      totalMessages,
      totalBurnoutAssessments: data.burnoutHistory.length,
      totalDiaryEntries: data.teacherDiary.length,
      lastUpdated: data.meta.lastUpdated,
      serverStatus: 'online',
    };

    return res.json({
      ...data,
      stats,
    });
  } catch (err: any) {
    console.error('Get all records error:', err);
    return res.status(500).json({ error: '서버 데이터 조회 중 오류가 발생했습니다.' });
  }
});

// Sessions
app.get('/api/records/sessions', async (_req: Request, res: Response) => {
  try {
    const sessions = await getSessions();
    return res.json(sessions);
  } catch (err: any) {
    return res.status(500).json({ error: '상담 세션 목록 조회 실패' });
  }
});

app.post('/api/records/sessions', async (req: Request, res: Response) => {
  try {
    const session = req.body;
    if (!session || !session.id) {
      return res.status(400).json({ error: '유효한 세션 데이터가 아닙니다.' });
    }
    const saved = await saveSession(session);
    return res.json({ success: true, session: saved });
  } catch (err: any) {
    console.error('Save session error:', err);
    return res.status(500).json({ error: '상담 세션 저장 실패' });
  }
});

app.patch('/api/records/sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await updateSessionMeta(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: '해당 세션을 찾을 수 없습니다.' });
    }
    return res.json({ success: true, session: updated });
  } catch (err: any) {
    return res.status(500).json({ error: '세션 정보 수정 실패' });
  }
});

// ==========================================
// 5. Stress Category & Data Analytics API
// ==========================================

app.get('/api/analytics', async (_req: Request, res: Response) => {
  try {
    const analysis = await getLatestAnalysis();
    const sessions = await getSessions();
    return res.json({
      analysis,
      categories: STRESS_CATEGORIES,
      sessions,
    });
  } catch (err: any) {
    console.error('Analytics get error:', err);
    return res.status(500).json({ error: '분석 데이터 조회 실패' });
  }
});

app.post('/api/analytics/run-diagnosis', async (_req: Request, res: Response) => {
  try {
    const sessions = await getSessions();
    if (!sessions || sessions.length === 0) {
      return res.status(400).json({ error: '분석할 상담 세션 기록이 없습니다.' });
    }

    // Aggregate user statements from sessions
    const sessionsSummary = sessions.map((s, idx) => {
      const userTexts = (s.messages || [])
        .filter((m) => m.role === 'user')
        .map((m) => m.text)
        .join(' ');
      return `[세션 ${idx + 1}] 제목: "${s.title}", 상담사: ${s.counselorName}, 내담자 발화: "${userTexts}", 현재 분류: ${s.categoryName || '미분류'}`;
    }).join('\n\n');

    const prompt = `당신은 대한민국 교원 전문 심리상담 분석가이자 교직 스트레스 빅데이터 분석 AI입니다.
아래는 한 선생님이 AI 상담사들과 나눈 상담 세션 대화 기록 전문 및 요약입니다.

[상담 기록 데이터]:
${sessionsSummary}

위 대화 데이터를 심층 분석하여, 선생님이 어떤 분야(학부모 민원, 행정 업무, 수업/생활지도, 정서 소진/인간관계)에서 가장 극심한 스트레스를 겪고 계신지 정밀 진단하고 향후 상담사가 내담자를 더 잘 케어할 수 있는 맞춤 전략을 도출해 주세요.

반드시 아래 JSON 형식으로만 응답해 주세요:
\`\`\`json
{
  "primaryStressCategory": "parent_complaint",
  "primaryCategoryName": "학부모 민원 및 교권 침해",
  "categoryDistribution": {
    "parent_complaint": { "count": 2, "percentage": 40, "name": "학부모 민원 및 교권" },
    "admin_work": { "count": 1, "percentage": 20, "name": "행정 업무 및 잡무" },
    "classroom_instruction": { "count": 1, "percentage": 25, "name": "수업 및 생활지도" },
    "emotional_burnout": { "count": 1, "percentage": 15, "name": "정서 소진 및 자책" }
  },
  "stressTrend": "선생님의 최근 스트레스 패턴과 가장 빈번히 발생하는 압박 상황 1~2문장 요약",
  "recurringTriggers": ["유발 요인 1", "유발 요인 2", "유발 요인 3", "유발 요인 4"],
  "emotionalKeywords": ["감정 단어 1", "감정 단어 2", "감정 단어 3", "감정 단어 4"],
  "aiComprehensiveDiagnosis": "선생님의 교직 생활 스트레스 구조에 대한 따뜻하고 심층적인 전문 분석 보고서 (3~4문장, 선생님의 높은 책임감과 소진 원인을 연결하여 분석)",
  "tailoredCounselingStrategy": "향후 AI 상담사가 이 선생님을 상담할 때 집중해야 할 핵심 가이드라인 및 공감 포인트 2~3줄",
  "recommendedActions": [
    {
      "title": "실천 방안 1 제목",
      "description": "학교 현장에서 바로 실천할 수 있는 구체적인 경계선 설정이나 행동 지침",
      "targetCategory": "민원·교권"
    },
    {
      "title": "실천 방안 2 제목",
      "description": "교실 또는 업무 상황에서 에너지를 아끼는 실천 팁",
      "targetCategory": "수업·생활지도"
    },
    {
      "title": "실천 방안 3 제목",
      "description": "선생님 자신의 심리적 죄책감을 덜어내는 마음 연습",
      "targetCategory": "정서소진·관계"
    }
  ]
}
\`\`\``;

    let fullAnalysis: TeacherStressAnalysis;

    try {
      const response = await callGeminiWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      fullAnalysis = {
        analyzedAt: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        totalConversations: sessions.length,
        primaryStressCategory: (parsed.primaryStressCategory as StressCategory) || 'parent_complaint',
        primaryCategoryName: parsed.primaryCategoryName || '학부모 민원 및 교권 침해',
        categoryDistribution: parsed.categoryDistribution || {
          parent_complaint: { count: 1, percentage: 40, name: '학부모 민원 및 교권' },
          admin_work: { count: 1, percentage: 20, name: '행정 업무 및 잡무' },
          classroom_instruction: { count: 1, percentage: 25, name: '수업 및 생활지도' },
          emotional_burnout: { count: 1, percentage: 15, name: '정서 소진 및 자책' },
        },
        stressTrend: parsed.stressTrend || '학부모 민원 및 수업 통제에서 높은 스트레스 양상 관측',
        recurringTriggers: parsed.recurringTriggers || ['퇴근 후 연락', '수업 방해', '공문 마감'],
        emotionalKeywords: parsed.emotionalKeywords || ['불안', '자책감', '회의감'],
        aiComprehensiveDiagnosis: parsed.aiComprehensiveDiagnosis || '선생님의 책임감이 높으나 경계선 설정이 필요한 상태입니다.',
        tailoredCounselingStrategy: parsed.tailoredCounselingStrategy || '자책감을 덜어주고 구체적 선 긋기 가이드를 제시할 것.',
        recommendedActions: parsed.recommendedActions || [],
      };
    } catch (llmErr: any) {
      console.warn('Gemini LLM analysis unavailable or busy, using local clinical synthesis:', llmErr?.message);
      // High-demand 503 / API unavailable safety fallback:
      fullAnalysis = synthesizeDiagnosisLocally(sessions);
    }

    await saveLatestAnalysis(fullAnalysis);

    return res.json({
      success: true,
      analysis: fullAnalysis,
    });
  } catch (err: any) {
    console.error('Run diagnosis error:', err);
    // Even if any unexpected error occurs, generate fallback from existing sessions
    try {
      const sessions = await getSessions();
      const fallbackAnalysis = synthesizeDiagnosisLocally(sessions);
      await saveLatestAnalysis(fallbackAnalysis);
      return res.json({ success: true, analysis: fallbackAnalysis });
    } catch (finalErr) {
      return res.status(500).json({ error: 'AI 스트레스 분석 실패', details: err?.message });
    }
  }
});

app.delete('/api/records/sessions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteSession(id);
    return res.json({ success: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: '세션 삭제 실패' });
  }
});

// Burnout History
app.get('/api/records/burnout', async (_req: Request, res: Response) => {
  try {
    const list = await getBurnoutHistory();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: '번아웃 진단 이력 조회 실패' });
  }
});

app.post('/api/records/burnout', async (req: Request, res: Response) => {
  try {
    const record = req.body;
    if (!record || !record.id) {
      return res.status(400).json({ error: '유효한 진단 결과가 아닙니다.' });
    }
    const saved = await saveBurnoutRecord(record);
    return res.json({ success: true, record: saved });
  } catch (err: any) {
    return res.status(500).json({ error: '진단 기록 저장 실패' });
  }
});

app.delete('/api/records/burnout/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteBurnoutRecord(id);
    return res.json({ success: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: '진단 기록 삭제 실패' });
  }
});

// Teacher Diary
app.get('/api/records/diary', async (_req: Request, res: Response) => {
  try {
    const diary = await getTeacherDiary();
    return res.json(diary);
  } catch (err: any) {
    return res.status(500).json({ error: '교사 일기 목록 조회 실패' });
  }
});

app.post('/api/records/diary', async (req: Request, res: Response) => {
  try {
    const entry = req.body;
    if (!entry || !entry.content) {
      return res.status(400).json({ error: '일기 내용을 입력해 주세요.' });
    }
    const saved = await saveDiaryEntry(entry);
    return res.json({ success: true, entry: saved });
  } catch (err: any) {
    return res.status(500).json({ error: '일기 저장 실패' });
  }
});

app.delete('/api/records/diary/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteDiaryEntry(id);
    return res.json({ success: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: '일기 삭제 실패' });
  }
});

// Export all data as JSON
app.get('/api/records/export', async (_req: Request, res: Response) => {
  try {
    const data = await getAllData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="todaksaem_counseling_backup_${Date.now()}.json"`);
    return res.send(JSON.stringify(data, null, 2));
  } catch (err: any) {
    return res.status(500).json({ error: '데이터 내보내기 실패' });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  await initServerStorage();

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TodakSaem] Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});

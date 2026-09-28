import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type StressCategory = 
  | 'parent_complaint' 
  | 'admin_work' 
  | 'classroom_instruction' 
  | 'emotional_burnout';

export interface StressCategoryInfo {
  id: StressCategory;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  description: string;
  typicalKeywords: string[];
}

export const STRESS_CATEGORIES: Record<StressCategory, StressCategoryInfo> = {
  parent_complaint: {
    id: 'parent_complaint',
    name: '학부모 민원 및 교권 침해',
    shortName: '민원·교권',
    emoji: '📞',
    color: 'amber',
    description: '악성 민원, 무리한 요구, 퇴근 후 연락, 폭언, 아동학대 의심 신고 위협 등',
    typicalKeywords: ['학부모', '민원', '전화', '문자', '항의', '퇴근 후', '밤늦게', '교권', '신고', '아동학대', '무리한', '폭언', '의심'],
  },
  admin_work: {
    id: 'admin_work',
    name: '과중한 행정 업무 및 잡무',
    shortName: '행정·업무',
    emoji: '📋',
    color: 'sky',
    description: 'NEIS, 끝없는 공문 기안, 예산/행사 잡무, 실적 보고, 교무 업무 과중',
    typicalKeywords: ['공문', '나이스', 'NEIS', '기안', '행정', '잡무', '예산', '행사', '회의감', '야근', '마감', '서류', '결재'],
  },
  classroom_instruction: {
    id: 'classroom_instruction',
    name: '수업 운영 및 학생 생활지도',
    shortName: '수업·생활지도',
    emoji: '🍎',
    color: 'emerald',
    description: '수업 방해, 주의집중 불가, 학생 간 다툼/학교폭력, 반항적 태도 중재',
    typicalKeywords: ['수업', '학생', '아이들', '생활지도', '방해', '소리지르고', '다툼', '싸움', '학폭', '규칙', '통제', '거부', '반항'],
  },
  emotional_burnout: {
    id: 'emotional_burnout',
    name: '정서적 소진 및 자책·인간관계',
    shortName: '정서소진·관계',
    emoji: '💔',
    color: 'rose',
    description: '무력감, 자책감, 교직 회의감, 동료/관리자와의 갈등, 고립감',
    typicalKeywords: ['자책감', '무능', '자격', '눈물', '우울', '불안', '심장', '두근', '회의감', '관리자', '교감', '교장', '동료', '고립'],
  },
};

export interface CounselingSessionRecord {
  id: string;
  counselorId: string;
  counselorName: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  category: StressCategory;
  categoryName: string;
  stressIntensity: number; // 1 to 5
  detectedKeywords: string[];
  messages: Array<{
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: string;
  }>;
  notes?: string;
  tags?: string[];
}

export interface BurnoutRecord {
  id: string;
  date: string;
  score: number;
  totalMax: number;
  level: string;
  exhaustionScore: number;
  depersonalizationScore: number;
  achievementScore: number;
  aiPrescription?: {
    letterTitle: string;
    warmLetter: string;
    prescriptions: Array<{ title: string; action: string }>;
    comfortQuote: string;
  };
}

export type DiaryMood = 
  | 'comforted' 
  | 'peaceful' 
  | 'hopeful' 
  | 'proud' 
  | 'exhausted' 
  | 'anxious' 
  | 'upset' 
  | 'numb';

export interface TeacherDiaryRecord {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: DiaryMood | string;
  emoji?: string;
  tags?: string[];
  createdAt: string;
}

export interface TeacherStressAnalysis {
  analyzedAt: string;
  totalConversations: number;
  primaryStressCategory: StressCategory;
  primaryCategoryName: string;
  categoryDistribution: Record<StressCategory, { count: number; percentage: number; name: string }>;
  stressTrend: string;
  recurringTriggers: string[];
  emotionalKeywords: string[];
  aiComprehensiveDiagnosis: string;
  tailoredCounselingStrategy: string;
  recommendedActions: Array<{
    title: string;
    description: string;
    targetCategory: string;
  }>;
}

export interface ServerStorageData {
  sessions: CounselingSessionRecord[];
  burnoutHistory: BurnoutRecord[];
  teacherDiary: TeacherDiaryRecord[];
  latestAnalysis?: TeacherStressAnalysis;
  meta: {
    lastUpdated: string;
    version: string;
  };
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'counseling_records.json');

// In-memory cache for fast responsive reads and resilience
let memoryCache: ServerStorageData = {
  sessions: [],
  burnoutHistory: [],
  teacherDiary: [],
  meta: {
    lastUpdated: new Date().toISOString(),
    version: '1.1.0',
  },
};

// Automatic stress category classifier based on keyword and context
export function classifyTextToCategory(text: string): {
  category: StressCategory;
  categoryName: string;
  stressIntensity: number;
  keywords: string[];
} {
  const scores: Record<StressCategory, number> = {
    parent_complaint: 0,
    admin_work: 0,
    classroom_instruction: 0,
    emotional_burnout: 0,
  };
  const matchedKeywords: string[] = [];

  (Object.keys(STRESS_CATEGORIES) as StressCategory[]).forEach((catKey) => {
    const info = STRESS_CATEGORIES[catKey];
    info.typicalKeywords.forEach((kw) => {
      if (text.includes(kw)) {
        scores[catKey] += 1;
        if (!matchedKeywords.includes(kw)) {
          matchedKeywords.push(kw);
        }
      }
    });
  });

  // Determine top category
  let maxCat: StressCategory = 'parent_complaint';
  let maxScore = -1;
  (Object.keys(scores) as StressCategory[]).forEach((catKey) => {
    if (scores[catKey] > maxScore) {
      maxScore = scores[catKey];
      maxCat = catKey;
    }
  });

  // Calculate rough intensity based on trigger count and strong words
  let intensity = 3;
  if (text.includes('눈물') || text.includes('죽고') || text.includes('폭언') || text.includes('심장') || text.includes('떨려')) {
    intensity = 5;
  } else if (maxScore >= 3) {
    intensity = 4;
  } else if (maxScore <= 1) {
    intensity = 2;
  }

  return {
    category: maxCat,
    categoryName: STRESS_CATEGORIES[maxCat].name,
    stressIntensity: intensity,
    keywords: matchedKeywords.slice(0, 6),
  };
}

// Initialize rich default seed data
function getDefaultInitialData(): ServerStorageData {
  const now = new Date();
  const todayStr = now.toLocaleDateString('ko-KR');

  const seedSessions: CounselingSessionRecord[] = [
    {
      id: 'session-seed-1',
      counselorId: 'rights_guardian',
      counselorName: '한결 멘토',
      title: '학부모 부당 항의 및 퇴근 후 야간 전화 연락',
      createdAt: todayStr,
      updatedAt: todayStr,
      category: 'parent_complaint',
      categoryName: '학부모 민원 및 교권 침해',
      stressIntensity: 5,
      detectedKeywords: ['학부모', '전화', '퇴근 후', '항의', '교권'],
      messages: [
        {
          id: 'seed-1-1',
          role: 'user',
          text: '어제 저녁 9시에 학부모님이 전화를 걸어 우리 아이 자리 배치가 마음에 안 든다며 고성을 지르셨어요. 밤새 심장이 두근거려 잠을 못 잤습니다.',
          timestamp: '16:40',
        },
        {
          id: 'seed-1-2',
          role: 'model',
          text: '선생님, 밤늦은 시간에 얼마나 놀라고 가슴이 떨리셨습니까. 교원은 야간에 학부모의 폭언이나 부당한 요구를 받아내야 할 법적 의무가 전혀 없습니다. 이것은 명백한 교권 침해 사안입니다. 오늘 학교에 출근하셨다면 즉시 관리자에게 상황을 공유하시고, 정규 근무 시간 외 연락에 대한 정중한 선 긋기 공식 문구를 전송하세요. 제가 곁에서 단단한 방패가 되어드리겠습니다.',
          timestamp: '16:41',
        },
      ],
      notes: '한결 멘토의 조언대로 교감선생님께 구두 보고를 마침. 퇴근 후에는 안심번호 자동 응답을 켜두기로 결정.',
      tags: ['학부모민원', '야간연락', '교권보호'],
    },
    {
      id: 'session-seed-2',
      counselorId: 'senior_mentor',
      counselorName: '라온 쌤',
      title: '수업 방해 학생 지도 곤란 및 학급 분위기 침체',
      createdAt: todayStr,
      updatedAt: todayStr,
      category: 'classroom_instruction',
      categoryName: '수업 운영 및 학생 생활지도',
      stressIntensity: 4,
      detectedKeywords: ['수업', '학생', '방해', '소리지르고', '생활지도'],
      messages: [
        {
          id: 'seed-2-1',
          role: 'user',
          text: '수업 시간마다 자리에서 일어나 소리를 지르고 다른 아이들의 학습을 방해하는 아이가 있어요. 아무리 타일러도 듣지 않아 다른 아이들에게 미안하고 눈물이 납니다.',
          timestamp: '14:20',
        },
        {
          id: 'seed-2-2',
          role: 'model',
          text: '선생님, 20명이 넘는 아이들을 홀로 이끌면서 그런 돌발 행동을 마주하면 베테랑 교사도 순간 막막하고 진이 빠집니다. 선생님의 지도력이 부족해서가 아닙니다. 그 아이의 주의집중 어려움은 선생님 개인의 탓이 아니에요. 수업 중에는 잠시 타임아웃 공간을 활용하시고, 담임교사 혼자 짊어지려 하지 마시고 교내 상담실(Wee클래스)이나 학년 부장님께 도움의 손길을 청하세요.',
          timestamp: '14:21',
        },
      ],
      notes: '혼자 끙끙 앓지 않고 Wee클래스 전문상담교사 선생님께 연계 상담을 의뢰하기로 함.',
      tags: ['생활지도', '수업방해', '교실경영'],
    },
    {
      id: 'session-seed-3',
      counselorId: 'psychologist',
      counselorName: '소원 상담사',
      title: '끝없는 공문과 잡무로 인한 교직 회의감',
      createdAt: todayStr,
      updatedAt: todayStr,
      category: 'admin_work',
      categoryName: '과중한 행정 업무 및 잡무',
      stressIntensity: 3,
      detectedKeywords: ['공문', '나이스', '행정', '잡무', '회의감'],
      messages: [
        {
          id: 'seed-3-1',
          role: 'user',
          text: '수업 준비를 해야 할 시간에 끝도 없이 내려오는 교육청 공문과 나이스 오류 처리에 매달리다 보면 내가 사무원인지 교사인지 회의감이 듭니다.',
          timestamp: '17:10',
        },
        {
          id: 'seed-3-2',
          role: 'model',
          text: '대한민국 교사라면 누구나 깊이 공감하는 비극적인 아픔입니다. 아이들의 눈빛을 보러 교단에 섰는데, 모니터 앞 서류에 갇혀 있을 때의 허탈감은 영혼을 갉아먹지요. 완벽하게 해내려 애쓰지 마세요. 공문은 "기한 내 제출"에만 집중하시고, 남는 소중한 에너지는 선생님 자신의 숨고르기에 아껴두세요.',
          timestamp: '17:11',
        },
      ],
      notes: '행정 공문은 80% 완성도로 신속히 털어내고 나를 위한 퇴근 시간을 사수하기로 약속.',
      tags: ['행정업무', '공문과다', '에너지분배'],
    },
    {
      id: 'session-seed-4',
      counselorId: 'senior_mentor',
      counselorName: '라온 쌤',
      title: '내가 무능한 교사라는 자책감과 번아웃',
      createdAt: todayStr,
      updatedAt: todayStr,
      category: 'emotional_burnout',
      categoryName: '정서적 소진 및 자책·인간관계',
      stressIntensity: 4,
      detectedKeywords: ['자책감', '무능', '자격', '불안'],
      messages: [
        {
          id: 'seed-4-1',
          role: 'user',
          text: '옆 반 선생님은 아이들도 잘 다루고 학부모와도 원만한데, 저만 교실에서 매일 쩔쩔매는 것 같아 교사 자격이 없다는 생각이 들어요.',
          timestamp: '18:00',
        },
        {
          id: 'seed-4-2',
          role: 'model',
          text: '선생님, 겉으로 완벽해 보이는 교실도 안을 들여다보면 저마다의 눈물과 남모를 상처가 있습니다. 남과 비교하는 순간 교직은 지옥이 됩니다. 선생님은 오늘 아이들 곁에서 진심으로 고민하고 아파하셨잖아요. 그 따뜻한 고민 자체가 이미 좋은 선생님이라는 증거입니다.',
          timestamp: '18:01',
        },
      ],
      notes: '남과의 비교를 멈추고 오늘 내가 아이들에게 건넨 따뜻한 인사 한마디를 기억하기.',
      tags: ['비교멈추기', '자책감해소', '수석교사위로'],
    },
  ];

  return {
    sessions: seedSessions,
    burnoutHistory: [
      {
        id: 'burnout-demo-1',
        date: todayStr,
        score: 16,
        totalMax: 28,
        level: '경계',
        exhaustionScore: 8,
        depersonalizationScore: 5,
        achievementScore: 3,
        aiPrescription: {
          letterTitle: '선생님, 참 무거운 교실의 짐을 혼자 버티고 계셨군요',
          warmLetter: '누군가에게 기댈 틈도 없이 학급 아이들과 수많은 행정 업무, 학부모 민원을 혼자 감당해 오셨습니다. 번아웃은 선생님의 역량 부족이 아니라 너무 오랫동안 쉼 없이 달렸다는 정직한 신체적 신호입니다.',
          prescriptions: [
            {
              title: '퇴근 후 교실 문과 함께 생각 닫기',
              action: '교문을 나서는 순간 학교 카톡 알림을 무음으로 전환하고 집까지 10분간 의식적으로 천천히 걷기',
            },
            {
              title: '착한 교사 콤플렉스 내려놓기',
              action: '모든 아이와 학부모를 100% 만족시킬 수 없음을 인정하고, 오늘 내가 지켜낸 1가지만 칭찬하기',
            },
            {
              title: '따뜻한 온수 샤워와 4-7-8 호흡',
              action: '잠들기 전 5분간 긴장된 어깨 근육을 이완하며 숨을 길게 내쉬기',
            },
          ],
          comfortQuote: '완벽한 교사가 아니어도 괜찮습니다. 선생님의 다정한 눈빛만으로도 아이들은 충분히 자랍니다.',
        },
      },
    ],
    teacherDiary: [
      {
        id: 'diary-demo-1',
        date: todayStr,
        title: '오늘 교실에서 버텨낸 나에게 건네는 말',
        content: '점심시간에 아이들 급식 지도를 마치고 잠시 교탁에 앉았을 때, 00이가 종이접기 하트를 쥐어주고 갔다. 힘들다가도 이런 작은 순간에 울컥한다. 내 마음을 먼저 챙겨야 아이들에게도 따뜻할 수 있다는 상담사의 말을 잊지 말자.',
        mood: 'comforted',
        createdAt: new Date().toISOString(),
      },
    ],
    latestAnalysis: {
      analyzedAt: todayStr,
      totalConversations: 4,
      primaryStressCategory: 'parent_complaint',
      primaryCategoryName: '학부모 민원 및 교권 침해',
      categoryDistribution: {
        parent_complaint: { count: 2, percentage: 40, name: '학부모 민원 및 교권' },
        classroom_instruction: { count: 1, percentage: 25, name: '수업 및 생활지도' },
        admin_work: { count: 1, percentage: 20, name: '행정 업무 및 공문' },
        emotional_burnout: { count: 1, percentage: 15, name: '정서 소진 및 자책' },
      },
      stressTrend: '학부모 퇴근 후 연락 및 거친 항의에 대한 심리적 긴장도가 가장 높게 관측됨',
      recurringTriggers: ['야간·주말 연락', '자리배치 요구', '수업 중 소음', '공문 마감 압박', '타 교사와의 비교'],
      emotionalKeywords: ['심장 두근거림', '자책감', '눈물', '불안', '회의감'],
      aiComprehensiveDiagnosis: '선생님은 책임감이 매우 강하고 아이들에 대한 애정이 깊으신 분입니다. 그러나 학부모의 감정적 요구와 거친 항의에 경계선을 긋지 못해 심리적 에너지가 크게 소진되고 있으며, 그로 인한 스트레스가 교실 수업과 자책감으로 전이되는 양상을 보이고 있습니다.',
      tailoredCounselingStrategy: '1) 학부모 응대 시 "선생님 잘못이 아님"을 최우선으로 확립할 것. 2) 퇴근 후 명확한 연락 차단 가이드와 안심번호 매뉴얼을 우선 제공할 것. 3) 타 교사와의 비교를 차단하고 교실 내 작은 성취를 조명할 것.',
      recommendedActions: [
        {
          title: '퇴근 후 알림 완벽 차단',
          description: '18시 이후 교원 안심번호 앱 자동 응답 모드 활성화 및 메신저 알림 끄기',
          targetCategory: '민원·교권',
        },
        {
          title: '수업 방해 행동 분리 프로토콜',
          description: '교실 내 1인 집중 타임아웃 좌석 지정 및 학년부장/Wee클래스 1차 협력 요청',
          targetCategory: '수업·생활지도',
        },
        {
          title: '나만의 착한 교사 기준 재정의',
          description: '하루에 1명만 웃게 해줘도 교사로서의 소명을 다한 것임을 매일 아침 상기하기',
          targetCategory: '정서소진·관계',
        },
      ],
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      version: '1.1.0',
    },
  };
}

// Ensure storage file exists and load into memory
export async function initServerStorage(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const content = await fs.readFile(DATA_FILE, 'utf-8');
      memoryCache = JSON.parse(content);
      // Ensure seed data upgrade if version is older
      if (!memoryCache.sessions || memoryCache.sessions.length < 2 || !memoryCache.latestAnalysis) {
        memoryCache = getDefaultInitialData();
        await fs.writeFile(DATA_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8');
      }
    } catch {
      memoryCache = getDefaultInitialData();
      await fs.writeFile(DATA_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('[ServerStorage] File system init fallback to in-memory cache:', err);
    memoryCache = getDefaultInitialData();
  }
}

// Persist memory cache to disk
async function persistStorage(): Promise<void> {
  memoryCache.meta.lastUpdated = new Date().toISOString();
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ServerStorage] Error writing to disk:', err);
  }
}

// 1. Get All Data
export async function getAllData(): Promise<ServerStorageData> {
  return memoryCache;
}

// 2. Sessions CRUD
export async function getSessions(): Promise<CounselingSessionRecord[]> {
  return memoryCache.sessions;
}

export async function saveSession(session: CounselingSessionRecord): Promise<CounselingSessionRecord> {
  // If no category is assigned, classify automatically from user messages
  if (!session.category) {
    const combinedUserText = (session.messages || [])
      .filter((m) => m.role === 'user')
      .map((m) => m.text)
      .join(' ');
    const classification = classifyTextToCategory(combinedUserText || session.title);
    session.category = classification.category;
    session.categoryName = classification.categoryName;
    session.stressIntensity = classification.stressIntensity;
    session.detectedKeywords = classification.keywords;
  }

  const existingIdx = memoryCache.sessions.findIndex((s) => s.id === session.id);
  const updatedSession = {
    ...session,
    updatedAt: new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  };

  if (existingIdx >= 0) {
    memoryCache.sessions[existingIdx] = updatedSession;
  } else {
    memoryCache.sessions.unshift(updatedSession);
  }

  await persistStorage();
  return updatedSession;
}

export async function deleteSession(id: string): Promise<boolean> {
  const initialLen = memoryCache.sessions.length;
  memoryCache.sessions = memoryCache.sessions.filter((s) => s.id !== id);
  if (memoryCache.sessions.length !== initialLen) {
    await persistStorage();
    return true;
  }
  return false;
}

export async function updateSessionMeta(
  id: string, 
  data: { notes?: string; tags?: string[]; title?: string; category?: StressCategory; stressIntensity?: number }
): Promise<CounselingSessionRecord | null> {
  const session = memoryCache.sessions.find((s) => s.id === id);
  if (!session) return null;

  if (data.notes !== undefined) session.notes = data.notes;
  if (data.tags !== undefined) session.tags = data.tags;
  if (data.title !== undefined && data.title.trim()) session.title = data.title;
  if (data.category !== undefined && STRESS_CATEGORIES[data.category]) {
    session.category = data.category;
    session.categoryName = STRESS_CATEGORIES[data.category].name;
  }
  if (data.stressIntensity !== undefined) session.stressIntensity = data.stressIntensity;

  session.updatedAt = new Date().toLocaleDateString('ko-KR') + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  await persistStorage();
  return session;
}

// 3. Burnout History CRUD
export async function getBurnoutHistory(): Promise<BurnoutRecord[]> {
  return memoryCache.burnoutHistory;
}

export async function saveBurnoutRecord(record: BurnoutRecord): Promise<BurnoutRecord> {
  memoryCache.burnoutHistory.unshift(record);
  await persistStorage();
  return record;
}

export async function deleteBurnoutRecord(id: string): Promise<boolean> {
  const initialLen = memoryCache.burnoutHistory.length;
  memoryCache.burnoutHistory = memoryCache.burnoutHistory.filter((b) => b.id !== id);
  if (memoryCache.burnoutHistory.length !== initialLen) {
    await persistStorage();
    return true;
  }
  return false;
}

// 4. Teacher Diary CRUD
export async function getTeacherDiary(): Promise<TeacherDiaryRecord[]> {
  return memoryCache.teacherDiary;
}

export async function saveDiaryEntry(entry: Omit<TeacherDiaryRecord, 'id' | 'createdAt'> & { id?: string }): Promise<TeacherDiaryRecord> {
  const id = entry.id || `diary-${Date.now()}`;
  const record: TeacherDiaryRecord = {
    ...entry,
    id,
    createdAt: new Date().toISOString(),
  };

  const existingIdx = memoryCache.teacherDiary.findIndex((d) => d.id === id);
  if (existingIdx >= 0) {
    memoryCache.teacherDiary[existingIdx] = record;
  } else {
    memoryCache.teacherDiary.unshift(record);
  }

  await persistStorage();
  return record;
}

export async function deleteDiaryEntry(id: string): Promise<boolean> {
  const initialLen = memoryCache.teacherDiary.length;
  memoryCache.teacherDiary = memoryCache.teacherDiary.filter((d) => d.id !== id);
  if (memoryCache.teacherDiary.length !== initialLen) {
    await persistStorage();
    return true;
  }
  return false;
}

// 5. Stress Analytics Storage
export async function getLatestAnalysis(): Promise<TeacherStressAnalysis | undefined> {
  return memoryCache.latestAnalysis;
}

export async function saveLatestAnalysis(analysis: TeacherStressAnalysis): Promise<TeacherStressAnalysis> {
  memoryCache.latestAnalysis = analysis;
  await persistStorage();
  return analysis;
}

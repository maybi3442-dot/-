import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  Flame, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Target, 
  Brain, 
  Heart, 
  HelpCircle, 
  Tag, 
  Filter, 
  Layers,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  Sliders
} from 'lucide-react';
import { playChime } from '../utils/audio';

export type StressCategory = 
  | 'parent_complaint' 
  | 'admin_work' 
  | 'classroom_instruction' 
  | 'emotional_burnout';

interface CategoryInfo {
  id: StressCategory;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  description: string;
}

interface TeacherStressAnalysis {
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

interface SessionRecord {
  id: string;
  counselorId: string;
  counselorName: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  category: StressCategory;
  categoryName: string;
  stressIntensity: number;
  detectedKeywords: string[];
  messages: Array<{
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: string;
  }>;
}

interface AnalyticsResponse {
  analysis: TeacherStressAnalysis;
  categories: Record<StressCategory, CategoryInfo>;
  sessions: SessionRecord[];
}

interface StressAnalyticsProps {
  onGoToChatWithCategory?: (category: StressCategory) => void;
}

export const StressAnalytics: React.FC<StressAnalyticsProps> = ({ onGoToChatWithCategory }) => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('분석 데이터 조회 실패');
      const json: AnalyticsResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      showToast('분석 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRunDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/analytics/run-diagnosis', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.analysis) {
        throw new Error(json?.error || '분석 데이터를 가져오지 못했습니다.');
      }
      setData((prev) => (prev ? { ...prev, analysis: json.analysis } : null));
      playChime();
      showToast('AI가 선생님의 대화 데이터를 심층 분석하여 상담 전략을 업그레이드했습니다!');
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      showToast(err?.message || '진단 도중 문제가 발생했습니다.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleUpdateSessionCategory = async (sessionId: string, newCategory: StressCategory) => {
    try {
      const res = await fetch(`/api/records/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      });
      if (!res.ok) throw new Error('분류 변경 실패');
      setEditingSessionId(null);
      await fetchAnalytics();
      showToast('상담 세션의 스트레스 분류가 갱신되었습니다.');
      playChime();
    } catch (err) {
      showToast('분류 변경 실패');
    }
  };

  const analysis = data?.analysis;
  const categories = data?.categories;
  const sessions = data?.sessions || [];

  const filteredSessions = sessions.filter((s) => {
    if (selectedCategoryFilter === 'all') return true;
    return s.category === selectedCategoryFilter;
  });

  const getCategoryTheme = (catKey: StressCategory) => {
    switch (catKey) {
      case 'parent_complaint':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-900',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          bar: 'bg-amber-500',
          emoji: '📞',
        };
      case 'admin_work':
        return {
          bg: 'bg-sky-50',
          border: 'border-sky-200',
          text: 'text-sky-900',
          badge: 'bg-sky-100 text-sky-800 border-sky-300',
          bar: 'bg-sky-500',
          emoji: '📋',
        };
      case 'classroom_instruction':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-900',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          bar: 'bg-emerald-500',
          emoji: '🍎',
        };
      case 'emotional_burnout':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-900',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          bar: 'bg-rose-500',
          emoji: '💔',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 border border-stone-700 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-emerald-800/80 rounded-lg text-emerald-200">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">선생님 스트레스 심층 데이터 분석</h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              AI 맞춤 케어 연동
            </span>
          </div>
          <p className="text-sm text-stone-300 leading-relaxed max-w-2xl">
            선생님이 털어놓으신 대화 데이터를 바탕으로 가장 많은 에너지를 앗아가는 취약 스트레스 분야(민원, 업무, 수업, 정서)를 분석하고, 
            AI 상담사가 선생님의 아픔을 기억하여 더욱 적합하고 깊이 있게 위로할 수 있도록 상담 시스템을 고도화합니다.
          </p>
        </div>

        <button
          onClick={handleRunDiagnosis}
          disabled={isDiagnosing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
          <span>{isDiagnosing ? '대화 심층 분석 중...' : 'AI 스트레스 분석 갱신'}</span>
        </button>
      </div>

      {/* Top Section: Primary Stressor Focus Card */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Primary Stressor Card (Left 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200">
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-amber-700" />
                  선생님의 1순위 취약 스트레스 영역
                </span>
                <span className="text-[11px] text-stone-400">
                  최근 분석일: {analysis.analyzedAt}
                </span>
              </div>

              <div className="mt-4 flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-3xl shrink-0 shadow-2xs">
                  {getCategoryTheme(analysis.primaryStressCategory).emoji}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                    {analysis.primaryCategoryName}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    선생님이 진행하신 전체 상담 중 약{' '}
                    <span className="font-bold text-amber-800">
                      {analysis.categoryDistribution[analysis.primaryStressCategory]?.percentage || 40}%
                    </span>
                    가 이 분야의 어려움으로 확인되었습니다.
                  </p>
                </div>
              </div>

              {/* Diagnosis Summary Paragraph */}
              <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed font-serif">
                {analysis.aiComprehensiveDiagnosis}
              </div>

              {/* Recurring Triggers & Emotional Keywords */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
                  <span className="font-bold text-amber-900 block mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    주요 반복 유발 요인 (Triggers)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {analysis.recurringTriggers.map((trig, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-white text-amber-800 px-2 py-0.5 rounded-md border border-amber-200"
                      >
                        {trig}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/80">
                  <span className="font-bold text-rose-900 block mb-1.5 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-700" />
                    자주 감지된 감정 상태
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {analysis.emotionalKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-white text-rose-800 px-2 py-0.5 rounded-md border border-rose-200"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Program Integration Badge */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                마음 상담실 AI 모델에 실시간 반영 중 (Active)
              </span>
              <span className="text-[11px] text-stone-400">
                상담사가 이 패턴을 기억하고 조언합니다
              </span>
            </div>
          </div>

          {/* AI Tailored Counseling Strategy (Right 5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-stone-900 to-emerald-950 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-stone-800">
                <Brain className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold">선생님 전담 상담 맞춤화 전략</h3>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3.5 bg-white/10 rounded-xl border border-white/15 text-xs text-stone-200 leading-relaxed font-sans">
                  <p className="font-bold text-emerald-300 mb-1">상담 모델 가이드라인:</p>
                  <p>{analysis.tailoredCounselingStrategy}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-emerald-200 block">
                    상담사별 집중 케어 포인트:
                  </span>
                  <div className="p-2.5 bg-black/20 rounded-lg text-xs space-y-1 text-stone-300">
                    <p>
                      <strong className="text-emerald-400">라온 쌤:</strong> "선생님 잘못이 아닙니다" 자책 차단
                    </p>
                    <p>
                      <strong className="text-amber-400">소원 상담사:</strong> {analysis.primaryCategoryName}로 인한 심장 두근거림 및 불면 케어
                    </p>
                    <p>
                      <strong className="text-sky-400">한결 멘토:</strong> 감정적 휘둘림 없는 단호한 공식 매뉴얼 선 제시
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
              <span>* 상담 데이터가 누적될수록 분석 정확도가 향상됩니다.</span>
            </div>
          </div>
        </div>
      )}

      {/* Stress Distribution 4 Categories Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-700" />
            분야별 스트레스 비중 & 누적 분포
          </h3>
          <span className="text-xs text-stone-500">
            총 {analysis?.totalConversations || sessions.length}건의 상담 세션 기준
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(categories || {}) as StressCategory[]).map((catKey) => {
            const catInfo = categories?.[catKey];
            const dist = analysis?.categoryDistribution?.[catKey];
            const percentage = dist?.percentage || 0;
            const count = dist?.count || 0;
            const theme = getCategoryTheme(catKey);

            return (
              <div
                key={catKey}
                className={`p-5 rounded-2xl border ${theme.border} ${theme.bg} shadow-2xs flex flex-col justify-between space-y-3 transition-all hover:shadow-xs`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{theme.emoji}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                      {percentage}%
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900">{catInfo?.name}</h4>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
                    {catInfo?.description}
                  </p>
                </div>

                <div>
                  {/* Progress bar */}
                  <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${theme.bar} transition-all duration-500 rounded-full`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>상담 건수: {count}건</span>
                    <button
                      onClick={() => setSelectedCategoryFilter(catKey)}
                      className="font-medium text-stone-700 hover:text-stone-900 hover:underline"
                    >
                      목록 보기
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Practical Actions for this Teacher */}
      {analysis?.recommendedActions && analysis.recommendedActions.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
            <FileCheck2 className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="text-base font-bold text-stone-900">
                선생님의 스트레스 맞춤 교직 처방 가이드
              </h3>
              <p className="text-xs text-stone-500">
                1순위 스트레스 요인을 즉각 완화하기 위해 오늘부터 교실과 퇴근길에 적용할 수 있는 솔루션입니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysis.recommendedActions.map((action, idx) => (
              <div
                key={idx}
                className="p-4 bg-stone-50 rounded-xl border border-stone-200/90 flex flex-col justify-between space-y-2"
              >
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    {action.targetCategory}
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 mt-2">{action.title}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session-level Stress Classification Table / List */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-3">
          <div>
            <h3 className="text-base font-bold text-stone-900">
              세션별 스트레스 분류 및 데이터 상세 ({filteredSessions.length}건)
            </h3>
            <p className="text-xs text-stone-500">
              각 대화가 어떤 분야로 분류되었는지 확인하고, 필요 시 분류를 직접 재조정할 수 있습니다.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs scrollbar-none">
            <span className="text-stone-400 text-[11px] mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> 필터:
            </span>
            {[
              { id: 'all', label: '전체' },
              { id: 'parent_complaint', label: '📞 민원·교권' },
              { id: 'admin_work', label: '📋 행정·업무' },
              { id: 'classroom_instruction', label: '🍎 수업·생활지도' },
              { id: 'emotional_burnout', label: '💔 정서소진·관계' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedCategoryFilter(btn.id)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                  selectedCategoryFilter === btn.id
                    ? 'bg-emerald-800 text-white font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        <div className="space-y-3">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => {
              const theme = getCategoryTheme(session.category);
              const isEditing = editingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md font-bold border text-[11px] ${theme.badge}`}>
                        {theme.emoji} {session.categoryName || '미분류'}
                      </span>
                      <span className="text-[11px] text-stone-400">{session.updatedAt}</span>
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        상담사: {session.counselorName}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-stone-900">{session.title}</h4>

                    <p className="text-xs text-stone-500 line-clamp-1">
                      {session.messages?.[session.messages.length - 1]?.text || '대화 내용 없음'}
                    </p>

                    {session.detectedKeywords && session.detectedKeywords.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-stone-400 pt-0.5">
                        <Tag className="w-3 h-3 text-stone-400" />
                        <span>감지된 키워드: {session.detectedKeywords.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions & Category Selector */}
                  <div className="shrink-0 flex items-center gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <select
                          defaultValue={session.category}
                          onChange={(e) =>
                            handleUpdateSessionCategory(session.id, e.target.value as StressCategory)
                          }
                          className="p-1.5 bg-white border border-emerald-600 rounded-lg text-xs text-stone-800 outline-none"
                        >
                          <option value="parent_complaint">📞 학부모 민원 및 교권</option>
                          <option value="admin_work">📋 행정 업무 및 잡무</option>
                          <option value="classroom_instruction">🍎 수업 및 생활지도</option>
                          <option value="emotional_burnout">💔 정서 소진 및 자책</option>
                        </select>
                        <button
                          onClick={() => setEditingSessionId(null)}
                          className="px-2 py-1 text-stone-500 hover:text-stone-800 text-xs"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingSessionId(session.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 bg-white px-2.5 py-1 rounded-lg border border-stone-200"
                        title="분류 수동 변경"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>분류 변경</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-stone-400 text-xs">
              해당 분류에 속한 상담 세션이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

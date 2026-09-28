import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  RefreshCw, 
  Download, 
  MessageSquare, 
  HeartHandshake, 
  BookOpen, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  Calendar, 
  Tag, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Plus, 
  Smile, 
  Frown, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { playChime } from '../utils/audio';

interface SessionItem {
  id: string;
  counselorId: string;
  counselorName: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: string;
  }>;
  notes?: string;
  tags?: string[];
}

interface BurnoutHistoryItem {
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

interface DiaryItem {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: 'peaceful' | 'exhausted' | 'anxious' | 'hopeful' | 'comforted';
  createdAt: string;
}

interface ServerDataResponse {
  sessions: SessionItem[];
  burnoutHistory: BurnoutHistoryItem[];
  teacherDiary: DiaryItem[];
  stats: {
    totalSessions: number;
    totalMessages: number;
    totalBurnoutAssessments: number;
    totalDiaryEntries: number;
    lastUpdated: string;
    serverStatus: string;
  };
}

interface CounselingDataHubProps {
  onContinueSession?: (session: SessionItem) => void;
}

export const CounselingDataHub: React.FC<CounselingDataHubProps> = ({ onContinueSession }) => {
  const [data, setData] = useState<ServerDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'burnout' | 'diary'>('sessions');

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounselorFilter, setSelectedCounselorFilter] = useState<string>('all');

  // Selected session to view details
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [expandedBurnoutId, setExpandedBurnoutId] = useState<string | null>(null);

  // New Diary state
  const [isAddingDiary, setIsAddingDiary] = useState(false);
  const [newDiaryTitle, setNewDiaryTitle] = useState('');
  const [newDiaryContent, setNewDiaryContent] = useState('');
  const [newDiaryMood, setNewDiaryMood] = useState<'peaceful' | 'exhausted' | 'anxious' | 'hopeful' | 'comforted'>('comforted');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchServerData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/records/all');
      if (!res.ok) throw new Error('서버 데이터를 불러오지 못했습니다.');
      const result = await res.json();
      setData(result);
      if (result.sessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(result.sessions[0].id);
      }
    } catch (err: any) {
      console.error('Fetch server data error:', err);
      showToast('서버 데이터 연결 실패. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServerData();
  }, []);

  // Update session notes / title
  const handleSaveSessionMeta = async (id: string) => {
    try {
      const res = await fetch(`/api/records/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: tempNotes,
          title: tempTitle,
        }),
      });
      if (!res.ok) throw new Error('수정에 실패했습니다.');
      await fetchServerData();
      setEditingNotesId(null);
      showToast('상담 메모와 제목이 서버에 저장되었습니다.');
      playChime();
    } catch (err) {
      showToast('저장 중 문제가 발생했습니다.');
    }
  };

  // Delete session
  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('이 상담 기록을 백엔드 서버에서 영구 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/records/sessions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      await fetchServerData();
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
      showToast('상담 세션이 서버에서 삭제되었습니다.');
    } catch (err) {
      showToast('삭제 중 오류가 발생했습니다.');
    }
  };

  // Delete burnout record
  const handleDeleteBurnout = async (id: string) => {
    if (!window.confirm('이 번아웃 진단 기록을 서버에서 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/records/burnout/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      await fetchServerData();
      showToast('진단 기록이 삭제되었습니다.');
    } catch (err) {
      showToast('삭제 실패');
    }
  };

  // Create diary entry
  const handleCreateDiary = async () => {
    if (!newDiaryContent.trim()) {
      alert('일기 내용을 입력해 주세요.');
      return;
    }
    try {
      const res = await fetch('/api/records/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toLocaleDateString('ko-KR'),
          title: newDiaryTitle.trim() || '오늘의 교실 성찰',
          content: newDiaryContent.trim(),
          mood: newDiaryMood,
        }),
      });
      if (!res.ok) throw new Error('일기 저장 실패');
      await fetchServerData();
      setIsAddingDiary(false);
      setNewDiaryTitle('');
      setNewDiaryContent('');
      showToast('선생님의 성찰 일기가 서버에 안전하게 보관되었습니다.');
      playChime();
    } catch (err) {
      showToast('일기 저장 중 오류 발생');
    }
  };

  // Delete diary entry
  const handleDeleteDiary = async (id: string) => {
    if (!window.confirm('이 일기를 서버에서 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/records/diary/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      await fetchServerData();
      showToast('일기가 삭제되었습니다.');
    } catch (err) {
      showToast('삭제 실패');
    }
  };

  // Filtered sessions
  const filteredSessions = (data?.sessions || []).filter((s) => {
    const matchesCounselor = selectedCounselorFilter === 'all' || s.counselorId === selectedCounselorFilter;
    const matchesSearch =
      searchTerm.trim() === '' ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.messages.some((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCounselor && matchesSearch;
  });

  const selectedSession = (data?.sessions || []).find((s) => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 border border-stone-700 animate-slideUp">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner: Backend Data Management Status */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-teal-950 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-emerald-800/80 rounded-lg text-emerald-200">
              <Database className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">백엔드 서버 상담 데이터 관리소</h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Server Storage Active
            </span>
          </div>
          <p className="text-sm text-stone-300 leading-relaxed max-w-2xl">
            Express 백엔드 서버를 통해 선생님의 상담 세션, 번아웃 진단 추이, 그리고 성찰 일기를 안전하고 체계적으로 통합 관리합니다.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchServerData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-800/90 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-medium border border-stone-700 transition-colors disabled:opacity-50"
            title="서버 데이터 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>

          <a
            href="/api/records/export"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            title="전체 상담 데이터 JSON 백업 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span>전체 데이터 백업</span>
          </a>
        </div>
      </div>

      {/* Stats Summary Bar */}
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              저장된 상담 세션
            </span>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-mono">
              {data.stats.totalSessions}
              <span className="text-xs font-normal text-stone-400 ml-1">개</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
              번아웃 진단 이력
            </span>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-mono">
              {data.stats.totalBurnoutAssessments}
              <span className="text-xs font-normal text-stone-400 ml-1">회</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-teal-700" />
              선생님 성찰 일기
            </span>
            <p className="text-2xl font-bold text-stone-900 mt-1 font-mono">
              {data.stats.totalDiaryEntries}
              <span className="text-xs font-normal text-stone-400 ml-1">편</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <span className="text-[11px] font-medium text-stone-500 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-sky-700" />
              서버 상태
            </span>
            <p className="text-sm font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              정상 연동 (Online)
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('sessions')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 ${
            activeSubTab === 'sessions'
              ? 'text-emerald-900 border-b-2 border-emerald-800'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>상담 세션 아카이브 ({data?.sessions.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('burnout')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 ${
            activeSubTab === 'burnout'
              ? 'text-emerald-900 border-b-2 border-emerald-800'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>번아웃 진단 이력 ({data?.burnoutHistory.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('diary')}
          className={`pb-3 transition-colors relative flex items-center gap-1.5 ${
            activeSubTab === 'diary'
              ? 'text-emerald-900 border-b-2 border-emerald-800'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>선생님 성찰 일기장 ({data?.teacherDiary.length || 0})</span>
        </button>
      </div>

      {/* 1. Counseling Sessions Tab */}
      {activeSubTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sessions List (Left) */}
          <div className="lg:col-span-5 space-y-3">
            {/* Filter and Search Bar */}
            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="제목, 메모, 대화 내용 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto text-[11px] scrollbar-none">
                {[
                  { id: 'all', label: '전체 상담사' },
                  { id: 'senior_mentor', label: '🌿 라온 쌤' },
                  { id: 'psychologist', label: '☕ 소원 상담사' },
                  { id: 'rights_guardian', label: '🛡️ 한결 멘토' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedCounselorFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
                      selectedCounselorFilter === f.id
                        ? 'bg-emerald-800 text-white font-semibold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => {
                  const isSelected = session.id === selectedSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setEditingNotesId(null);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50/50 border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                          : 'bg-white hover:bg-stone-50 border-stone-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          {session.counselorName}
                        </span>
                        <span className="text-[10px] text-stone-400">{session.updatedAt}</span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 mt-1 line-clamp-1">
                        {session.title}
                      </h4>

                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {session.messages?.[session.messages.length - 1]?.text || '대화 내용 없음'}
                      </p>

                      {session.notes && (
                        <div className="mt-2 text-[11px] text-amber-900 bg-amber-50/80 p-1.5 rounded-md border border-amber-200/60 line-clamp-1">
                          📝 {session.notes}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-stone-400 text-xs bg-white rounded-xl border border-stone-200">
                  저장된 상담 세션이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* Session Detail & Actions (Right) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
            {selectedSession ? (
              <div className="space-y-5">
                {/* Header with Title and Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {selectedSession.counselorName}와의 대화
                      </span>
                      <span className="text-[11px] text-stone-400">
                        대화 {selectedSession.messages.length}건
                      </span>
                    </div>

                    {editingNotesId === selectedSession.id ? (
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        className="text-base font-bold text-stone-900 border border-emerald-600 rounded-lg p-1.5 w-full mt-1 outline-none"
                      />
                    ) : (
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1">
                        {selectedSession.title}
                      </h3>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {onContinueSession && (
                      <button
                        onClick={() => onContinueSession(selectedSession)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium transition-colors"
                        title="이어서 상담하기"
                      >
                        <span>이어서 상담</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteSession(selectedSession.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="세션 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Teacher's Action Note & Reflection */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      선생님의 성찰 메모 & 실천 기록
                    </span>

                    {editingNotesId === selectedSession.id ? (
                      <button
                        onClick={() => handleSaveSessionMeta(selectedSession.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-medium"
                      >
                        <Save className="w-3 h-3" />
                        <span>저장</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingNotesId(selectedSession.id);
                          setTempNotes(selectedSession.notes || '');
                          setTempTitle(selectedSession.title);
                        }}
                        className="text-xs text-amber-800 hover:underline font-medium"
                      >
                        메모 수정
                      </button>
                    )}
                  </div>

                  {editingNotesId === selectedSession.id ? (
                    <textarea
                      rows={3}
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      placeholder="상담 후 느낀 점, 실천해 볼 마인드셋이나 다음 대처 방안을 적어보세요..."
                      className="w-full text-xs p-2.5 bg-white border border-amber-300 rounded-lg text-stone-800 focus:outline-none"
                    />
                  ) : (
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      {selectedSession.notes || '등록된 성찰 메모가 없습니다. [메모 수정]을 눌러 기록해 보세요.'}
                    </p>
                  )}
                </div>

                {/* Conversation Thread History */}
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                  {selectedSession.messages.map((m, idx) => {
                    const isModel = m.role === 'model';
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                          isModel
                            ? 'bg-stone-50 border border-stone-200 text-stone-800'
                            : 'bg-emerald-800 text-white ml-8 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-1 opacity-70">
                          <span>{isModel ? selectedSession.counselorName : '선생님'}</span>
                          <span>{m.timestamp}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-stone-400 text-xs">
                좌측에서 확인하고 싶은 상담 세션을 선택해 주세요.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Burnout Assessment History Tab */}
      {activeSubTab === 'burnout' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                백엔드 서버 저장 번아웃 검사 누적 이력
              </h3>
              <p className="text-xs text-stone-500">
                선생님의 정서적 소진도 변화 추이를 확인하고 과거의 처방 편지를 다시 읽어보실 수 있습니다.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data?.burnoutHistory && data.burnoutHistory.length > 0 ? (
              data.burnoutHistory.map((item) => {
                const isExpanded = expandedBurnoutId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-stone-500 bg-white px-2 py-1 rounded-md border border-stone-200">
                          {item.date}
                        </span>
                        <span className="text-sm font-bold text-stone-900">
                          총점 {item.score}점 / {item.totalMax}점
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {item.level} 단계
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.aiPrescription && (
                          <button
                            onClick={() => setExpandedBurnoutId(isExpanded ? null : item.id)}
                            className="text-xs text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1"
                          >
                            <span>처방 편지 {isExpanded ? '접기' : '보기'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBurnout(item.id)}
                          className="text-stone-400 hover:text-red-600 p-1"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                      <div className="bg-white p-2 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-500 block">정서적 고갈</span>
                        <span className="font-bold text-stone-800">{item.exhaustionScore}점</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-500 block">거리두기·냉담화</span>
                        <span className="font-bold text-stone-800">{item.depersonalizationScore}점</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-stone-200">
                        <span className="text-[10px] text-stone-500 block">개인 성취감 저하</span>
                        <span className="font-bold text-stone-800">{item.achievementScore}점</span>
                      </div>
                    </div>

                    {/* Expanded AI Prescription */}
                    {isExpanded && item.aiPrescription && (
                      <div className="mt-3 p-4 bg-white rounded-xl border border-stone-300 text-xs space-y-3 animate-fadeIn">
                        <p className="font-bold text-stone-900 text-sm font-serif">
                          {item.aiPrescription.letterTitle}
                        </p>
                        <p className="text-stone-700 leading-relaxed whitespace-pre-wrap font-serif">
                          {item.aiPrescription.warmLetter}
                        </p>
                        {item.aiPrescription.comfortQuote && (
                          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-900 font-medium italic">
                            "{item.aiPrescription.comfortQuote}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-stone-400 text-xs">
                기록된 번아웃 진단 내역이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Teacher Diary Tab */}
      {activeSubTab === 'diary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* New Diary Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              <h3 className="text-base font-bold text-stone-900">선생님 비밀 성찰 일기 작성</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">제목</label>
              <input
                type="text"
                placeholder="예: 오늘 교실에서 버텨낸 나에게 건네는 말"
                value={newDiaryTitle}
                onChange={(e) => setNewDiaryTitle(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                오늘의 마음 상태 (Mood)
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'comforted', label: '위로받음 🌿' },
                  { id: 'hopeful', label: '희망적 ☀️' },
                  { id: 'peaceful', label: '평온함 🍵' },
                  { id: 'anxious', label: '불안함 🌧️' },
                  { id: 'exhausted', label: '지침 🍂' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setNewDiaryMood(m.id as any)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      newDiaryMood === m.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">
                일기 내용 (자유롭게 털어놓으세요)
              </label>
              <textarea
                rows={5}
                placeholder="오늘 학교에서 느꼈던 복잡한 마음이나, 나를 칭찬하고 싶은 소소한 한 줄을 적어보세요..."
                value={newDiaryContent}
                onChange={(e) => setNewDiaryContent(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-emerald-600 resize-none"
              />
            </div>

            <button
              onClick={handleCreateDiary}
              className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>백엔드 서버에 일기 저장</span>
            </button>
          </div>

          {/* Diary List */}
          <div className="lg:col-span-7 space-y-3">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
              서버에 보관된 성찰 일기 목록 ({data?.teacherDiary.length || 0}편)
            </h4>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {data?.teacherDiary && data.teacherDiary.length > 0 ? (
                data.teacherDiary.map((diary) => (
                  <div
                    key={diary.id}
                    className="p-5 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-stone-400">{diary.date}</span>
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {diary.mood}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteDiary(diary.id)}
                        className="text-stone-400 hover:text-red-500"
                        title="일기 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h5 className="text-sm font-bold text-stone-900">{diary.title}</h5>

                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap font-serif">
                      {diary.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-stone-400 text-xs bg-white rounded-xl border border-stone-200">
                  아직 작성된 성찰 일기가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

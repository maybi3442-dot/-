import React, { useState, useEffect, useRef } from 'react';
import { CounselorId, ChatMessage, TeacherProfile } from '../types';
import { COUNSELORS, QUICK_TOPICS } from '../data/counselors';
import { speakComfortText, stopSpeaking, playChime } from '../utils/audio';
import { 
  Send, 
  RotateCcw, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldCheck, 
  HeartHandshake, 
  Bookmark, 
  ChevronRight,
  Info,
  Clock,
  Calendar
} from 'lucide-react';

interface CounselorChatProps {
  teacherProfile: TeacherProfile;
  onOpenProfile: () => void;
  onOpenHotline: () => void;
  activeSessionToLoad?: {
    counselorId: string;
    messages: ChatMessage[];
  } | null;
}

const STORAGE_KEY = 'todak_counselor_chats_v1';

export const CounselorChat: React.FC<CounselorChatProps> = ({
  teacherProfile,
  onOpenProfile,
  onOpenHotline,
  activeSessionToLoad,
}) => {
  const [selectedCounselorId, setSelectedCounselorId] = useState<CounselorId>('senior_mentor');
  const [serverSynced, setServerSynced] = useState(false);
  const [currentLiveTime, setCurrentLiveTime] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) + ' ' + now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  });

  // Keep live consultation clock updated every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentLiveTime(
        now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }) + ' ' + now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync session if loaded from Data Hub
  useEffect(() => {
    if (activeSessionToLoad && activeSessionToLoad.counselorId) {
      const cId = activeSessionToLoad.counselorId as CounselorId;
      setSelectedCounselorId(cId);
      if (activeSessionToLoad.messages && activeSessionToLoad.messages.length > 0) {
        setConversations((prev) => ({
          ...prev,
          [cId]: activeSessionToLoad.messages,
        }));
      }
    }
  }, [activeSessionToLoad]);
  const [conversations, setConversations] = useState<Record<CounselorId, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load saved chats', e);
    }
    const now = new Date();
    const initTimestamp = now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }) + ' ' + now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    // Initial welcome messages for all counselors
    return {
      senior_mentor: [
        {
          id: 'welcome-sm',
          role: 'model',
          text: COUNSELORS.senior_mentor.welcomeMessage,
          timestamp: initTimestamp,
          counselorId: 'senior_mentor',
        },
      ],
      psychologist: [
        {
          id: 'welcome-psy',
          role: 'model',
          text: COUNSELORS.psychologist.welcomeMessage,
          timestamp: initTimestamp,
          counselorId: 'psychologist',
        },
      ],
      rights_guardian: [
        {
          id: 'welcome-rg',
          role: 'model',
          text: COUNSELORS.rights_guardian.welcomeMessage,
          timestamp: initTimestamp,
          counselorId: 'rights_guardian',
        },
      ],
    };
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedBookmarkId, setSavedBookmarkId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentCounselor = COUNSELORS[selectedCounselorId];
  const currentMessages = conversations[selectedCounselorId] || [];

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.warn('Failed to save chat to localStorage', e);
    }
  }, [conversations]);

  // Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    const now = new Date();
    const formattedConsultationTime = 
      now.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' }) + ' ' + 
      now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageContent,
      timestamp: formattedConsultationTime,
      counselorId: selectedCounselorId,
    };

    const updatedList = [...currentMessages, userMessage];

    setConversations((prev) => ({
      ...prev,
      [selectedCounselorId]: updatedList,
    }));

    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counselorId: selectedCounselorId,
          messages: updatedList.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          teacherContext: teacherProfile,
        }),
      });

      if (!response.ok) {
        throw new Error('응답을 가져오지 못했습니다.');
      }

      const data = await response.json();
      const replyTime = new Date();
      const formattedReplyTime = 
        replyTime.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' }) + ' ' + 
        replyTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: formattedReplyTime,
        counselorId: selectedCounselorId,
      };

      const updatedMessagesWithModel = [...updatedList, modelMessage];
      setConversations((prev) => ({
        ...prev,
        [selectedCounselorId]: updatedMessagesWithModel,
      }));
      playChime();

      // Automatically sync session to backend server with exact consultation timestamps
      const fullDateStr = replyTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
      const fullTimeStr = replyTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

      fetch('/api/records/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `session-${selectedCounselorId}`,
          counselorId: selectedCounselorId,
          counselorName: currentCounselor.name,
          title: `${currentCounselor.name}와의 마음 상담 (${fullDateStr} ${fullTimeStr})`,
          createdAt: fullDateStr,
          updatedAt: `${fullDateStr} ${fullTimeStr}`,
          messages: updatedMessagesWithModel,
        }),
      })
        .then(() => {
          setServerSynced(true);
          setTimeout(() => setServerSynced(false), 2000);
        })
        .catch((e) => console.warn('Failed to sync to backend server', e));
    } catch (err: any) {
      console.error('Chat error:', err);
      const errTime = new Date();
      const fallbackErrorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: '선생님, 일시적으로 상담 연결이 지연되고 있습니다. 잠시 숨을 고르신 후 다시 한 번 말씀해 주시겠어요? 제가 늘 귀 기울이고 있습니다.',
        timestamp: errTime.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' }) + ' ' + errTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        counselorId: selectedCounselorId,
      };
      setConversations((prev) => ({
        ...prev,
        [selectedCounselorId]: [...updatedList, fallbackErrorMessage],
      }));
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    if (window.confirm('현재 상담사와의 대화 기록을 초기화하시겠습니까?')) {
      stopSpeaking();
      setConversations((prev) => ({
        ...prev,
        [selectedCounselorId]: [
          {
            id: `welcome-${Date.now()}`,
            role: 'model',
            text: currentCounselor.welcomeMessage,
            timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            counselorId: selectedCounselorId,
          },
        ],
      }));
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (speakingMessageId === id) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      stopSpeaking();
      setSpeakingMessageId(id);
      speakComfortText(text, () => {
        setSpeakingMessageId(null);
      });
    }
  };

  const handleSaveToDiary = (id: string, text: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('todak_comfort_saved') || '[]');
      existing.unshift({
        id: `saved-${Date.now()}`,
        counselorName: currentCounselor.name,
        date: new Date().toLocaleDateString('ko-KR'),
        text,
      });
      localStorage.setItem('todak_comfort_saved', JSON.stringify(existing.slice(0, 50)));
      setSavedBookmarkId(id);
      setTimeout(() => setSavedBookmarkId(null), 2000);
    } catch (e) {
      console.warn('Failed to save quote', e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[900px] bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* 1. Counselor Selection Header */}
      <div className="bg-stone-50 border-b border-stone-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Counselor Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(Object.values(COUNSELORS) as typeof COUNSELORS[CounselorId][]).map((counselor) => {
              const isActive = counselor.id === selectedCounselorId;
              return (
                <button
                  key={counselor.id}
                  onClick={() => {
                    stopSpeaking();
                    setSelectedCounselorId(counselor.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span className="text-base sm:text-lg">{counselor.avatarEmoji}</span>
                  <div className="text-left">
                    <p className="font-semibold leading-tight">{counselor.name}</p>
                    <p className={`text-[10px] hidden md:block ${isActive ? 'text-emerald-100' : 'text-stone-500'}`}>
                      {counselor.roleTitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Action buttons & profile badge */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors border border-stone-200"
              title="선생님 맞춤 설정"
            >
              <span>🍎 {teacherProfile.schoolLevel} ({teacherProfile.roleType})</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={handleResetChat}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              title="상담 대화 비우기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">비우기</span>
            </button>
          </div>
        </div>

        {/* Selected Counselor Subtitle Banner */}
        <div className="mt-2.5 pt-2 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-stone-800">{currentCounselor.name}</span>
            <span className="text-stone-400">|</span>
            <span className="text-stone-600 truncate">{currentCounselor.tagline}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {serverSynced ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-medium transition-all">
                <Check className="w-3 h-3 text-emerald-700" />
                <span>서버 저장됨</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>서버 실시간 연동 중</span>
              </span>
            )}
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>비밀 보장 & 안전 암호화</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Chat Scrollable Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAF9F5]/40">
        {currentMessages.map((msg) => {
          const isModel = msg.role === 'model';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}
            >
              {isModel && (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-xs self-start">
                  {currentCounselor.avatarEmoji}
                </div>
              )}

              <div
                className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                  isModel ? 'items-start' : 'items-end'
                }`}
              >
                {/* Sender Name and Consultation Time */}
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[11px] font-medium text-stone-500">
                    {isModel ? currentCounselor.name : '선생님'}
                  </span>
                  <span className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5 text-stone-400" />
                    <span>{msg.timestamp}</span>
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isModel
                      ? 'bg-white text-stone-800 border border-stone-200 shadow-xs rounded-tl-sm'
                      : 'bg-emerald-800 text-white rounded-tr-sm shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Counselor Message Action Tools (Read aloud, Copy, Save quote) */}
                {isModel && (
                  <div className="flex items-center gap-2 mt-1.5 px-1 text-stone-400 text-xs">
                    <button
                      onClick={() => handleToggleSpeak(msg.id, msg.text)}
                      className={`inline-flex items-center gap-1 hover:text-stone-700 transition-colors ${
                        speakingMessageId === msg.id ? 'text-emerald-700 font-medium' : ''
                      }`}
                      title={speakingMessageId === msg.id ? '음성 중지' : '다정한 음성으로 듣기'}
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                          <span className="text-[11px]">듣는 중...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span className="text-[11px]">음성으로 듣기</span>
                        </>
                      )}
                    </button>

                    <span className="text-stone-300">·</span>

                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 hover:text-stone-700 transition-colors"
                      title="위로 글 복사하기"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px] text-emerald-600">복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">복사</span>
                        </>
                      )}
                    </button>

                    <span className="text-stone-300">·</span>

                    <button
                      onClick={() => handleSaveToDiary(msg.id, msg.text)}
                      className="inline-flex items-center gap-1 hover:text-stone-700 transition-colors"
                      title="위로 보관함에 저장"
                    >
                      {savedBookmarkId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[11px] text-amber-600">보관함 저장됨</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span className="text-[11px]">마음 보관</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-lg sm:text-xl shrink-0">
              {currentCounselor.avatarEmoji}
            </div>
            <div className="bg-white border border-stone-200 px-4 py-3 rounded-2xl rounded-tl-sm text-xs sm:text-sm text-stone-600 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span>{currentCounselor.name}님이 선생님의 마음에 귀 기울이며 답변을 적고 계십니다...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Suggestion Topics */}
      <div className="px-4 py-2 bg-stone-50/70 border-t border-stone-200/80 overflow-x-auto scrollbar-none flex items-center gap-2">
        <span className="text-[11px] font-medium text-stone-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-600" />
          추천 질문:
        </span>
        {QUICK_TOPICS.map((topic, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(topic.prompt)}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-full shrink-0 transition-colors disabled:opacity-50"
          >
            {topic.label}
          </button>
        ))}
      </div>

      {/* 4. Chat Input Form */}
      <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
        <div className="relative flex flex-col bg-stone-50 rounded-2xl p-2.5 border border-stone-200 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 transition-all">
          {/* Real-time Consultation Time Header */}
          <div className="flex items-center justify-between px-1.5 pb-2 mb-1.5 border-b border-stone-200/70 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-emerald-900">
              <Clock className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
              <span>상담 진행 시각: <strong className="font-semibold text-emerald-950 font-mono">{currentLiveTime}</strong></span>
            </span>
            <span className="text-[10px] text-stone-400 hidden sm:inline">
              대화 전송 시 상담 일시와 내용이 서버에 안전하게 기록됩니다
            </span>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${currentCounselor.name}에게 마음속 응어리나 고민을 편안하게 털어놓으세요... (Shift + Enter: 줄바꿈)`}
              className="w-full bg-transparent resize-none outline-none text-xs sm:text-sm text-stone-800 placeholder-stone-400 max-h-32 px-2 py-1"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-xs"
              title="메시지 전송"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Safety Note & Hotline Trigger */}
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-stone-500">
          <div className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-stone-400" />
            <span>선생님의 마음 건강이 가장 소중합니다.</span>
          </div>
          <button
            onClick={onOpenHotline}
            className="text-stone-500 hover:text-emerald-800 underline transition-colors"
          >
            긴급 교원 지원 센터 & 핫라인 보기
          </button>
        </div>
      </div>
    </div>
  );
};

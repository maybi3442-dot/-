import React, { useState, useEffect } from 'react';
import { CounselorChat } from './components/CounselorChat';
import { CommunicationHelper } from './components/CommunicationHelper';
import { BurnoutAssessment } from './components/BurnoutAssessment';
import { MindfulSanctuary } from './components/MindfulSanctuary';
import { CounselingDataHub } from './components/CounselingDataHub';
import { StressAnalytics } from './components/StressAnalytics';
import { TeacherHotlineModal } from './components/TeacherHotlineModal';
import { TeacherProfileModal } from './components/TeacherProfileModal';
import { SavedQuotesModal } from './components/SavedQuotesModal';
import { TeacherProfile, ChatMessage } from './types';
import { startGentleRain, stopAmbientSound } from './utils/audio';
import { 
  MessageSquareHeart, 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  Settings, 
  PhoneCall,
  Leaf,
  Database,
  BarChart3
} from 'lucide-react';

const PROFILE_KEY = 'todak_teacher_profile_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'communication' | 'burnout' | 'sanctuary' | 'records' | 'analytics'>('chat');
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [sessionToContinue, setSessionToContinue] = useState<{
    counselorId: string;
    messages: ChatMessage[];
  } | null>(null);

  // Modals
  const [isHotlineOpen, setIsHotlineOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavedQuotesOpen, setIsSavedQuotesOpen] = useState(false);

  // Teacher Profile
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      schoolLevel: '초등학교',
      yearsOfService: '1~3년차 (신규·저경력)',
      roleType: '담임교사',
    };
  });

  const handleSaveProfile = (updated: TeacherProfile) => {
    setTeacherProfile(updated);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  };

  const handleToggleAmbient = () => {
    if (isAmbientPlaying) {
      stopAmbientSound();
      setIsAmbientPlaying(false);
    } else {
      startGentleRain();
      setIsAmbientPlaying(true);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Leaf className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight text-stone-900">토닥쌤</h1>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                  선생님 안심 쉼터
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                오늘도 교실을 지켜낸 선생님을 위한 마음 치유 & 교권 케어
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-stone-100/80 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquareHeart className="w-4 h-4 text-emerald-700" />
              <span>마음 상담실</span>
            </button>

            <button
              onClick={() => setActiveTab('communication')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'communication'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>교권 안심 소통</span>
            </button>

            <button
              onClick={() => setActiveTab('burnout')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'burnout'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HeartHandshake className="w-4 h-4 text-amber-700" />
              <span>번아웃 진단</span>
            </button>

            <button
              onClick={() => setActiveTab('sanctuary')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sanctuary'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>퇴근 & 쉼터</span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'records'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-700" />
              <span>데이터 관리소</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-emerald-600/30'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>스트레스 분석</span>
            </button>
          </nav>

          {/* Action Utilities */}
          <div className="flex items-center gap-1.5">
            {/* Ambient Rain Sound Button */}
            <button
              onClick={handleToggleAmbient}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                isAmbientPlaying
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white hover:bg-stone-100 border-stone-200 text-stone-600'
              }`}
              title={isAmbientPlaying ? '백색소음 빗소리 끄기' : '편안한 빗소리 켜기'}
            >
              {isAmbientPlaying ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-700 animate-pulse" />
                  <span className="hidden lg:inline text-[11px] font-medium">빗소리 켜짐</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-stone-400" />
                  <span className="hidden lg:inline text-[11px]">빗소리 힐링</span>
                </>
              )}
            </button>

            {/* Saved Quotes Bookmark */}
            <button
              onClick={() => setIsSavedQuotesOpen(true)}
              className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 transition-colors"
              title="마음 보관함"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Emergency Hotline Button */}
            <button
              onClick={() => setIsHotlineOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-colors flex items-center gap-1"
              title="교원 긴급 핫라인 (1395)"
            >
              <PhoneCall className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold">1395 핫라인</span>
            </button>

            {/* Teacher Profile Settings */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="p-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 transition-colors"
              title="선생님 정보 설정"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Scrollable on small devices) */}
        <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-stone-200 bg-stone-50/90 scrollbar-none gap-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'chat'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <MessageSquareHeart className="w-3.5 h-3.5" />
            <span>마음 상담실</span>
          </button>

          <button
            onClick={() => setActiveTab('communication')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'communication'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>교권 안심 소통</span>
          </button>

          <button
            onClick={() => setActiveTab('burnout')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'burnout'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>번아웃 진단</span>
          </button>

          <button
            onClick={() => setActiveTab('sanctuary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'sanctuary'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>퇴근 & 쉼터</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'records'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>데이터 관리소</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'analytics'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>스트레스 분석</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'chat' && (
          <CounselorChat
            teacherProfile={teacherProfile}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenHotline={() => setIsHotlineOpen(true)}
            activeSessionToLoad={sessionToContinue}
          />
        )}

        {activeTab === 'communication' && <CommunicationHelper />}

        {activeTab === 'burnout' && <BurnoutAssessment />}

        {activeTab === 'sanctuary' && <MindfulSanctuary />}

        {activeTab === 'records' && (
          <CounselingDataHub
            onContinueSession={(session) => {
              setSessionToContinue({
                counselorId: session.counselorId,
                messages: session.messages,
              });
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <StressAnalytics
            onGoToChatWithCategory={() => setActiveTab('chat')}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>선생님의 헌신과 노고에 깊이 감사드립니다. 당신은 결코 혼자가 아닙니다.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-800 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              백엔드 서버 데이터 관리 및 프라이버시 보호
            </span>
            <span>·</span>
            <button
              onClick={() => setIsHotlineOpen(true)}
              className="text-stone-600 hover:text-emerald-800 underline"
            >
              위기 지원 안내
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TeacherHotlineModal
        isOpen={isHotlineOpen}
        onClose={() => setIsHotlineOpen(false)}
      />

      <TeacherProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={teacherProfile}
        onSave={handleSaveProfile}
      />

      <SavedQuotesModal
        isOpen={isSavedQuotesOpen}
        onClose={() => setIsSavedQuotesOpen(false)}
      />
    </div>
  );
}

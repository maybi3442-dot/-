import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lock, 
  Unlock, 
  Wind, 
  Heart, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  BookHeart,
  Smile,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  Calendar,
  Tag,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { playChime } from '../utils/audio';

interface GratitudeItem {
  id: string;
  date: string;
  text: string;
}

export interface EmotionDiaryEntry {
  id: string;
  date: string;
  time?: string;
  title: string;
  content: string;
  mood: string;
  emoji: string;
  tags?: string[];
  createdAt: string;
}

const EMOTION_PRESETS = [
  {
    id: 'comforted',
    emoji: '🌿',
    label: '위로받음',
    subtext: '마음이 따스해진 하루',
    color: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    activeBg: 'bg-emerald-700 text-white border-emerald-700 shadow-xs',
  },
  {
    id: 'peaceful',
    emoji: '🍵',
    label: '평온함',
    subtext: '무탈하고 조용한 하루',
    color: 'bg-teal-50 border-teal-300 text-teal-900',
    activeBg: 'bg-teal-700 text-white border-teal-700 shadow-xs',
  },
  {
    id: 'hopeful',
    emoji: '☀️',
    label: '희망적',
    subtext: '작은 변화를 본 날',
    color: 'bg-amber-50 border-amber-300 text-amber-900',
    activeBg: 'bg-amber-600 text-white border-amber-600 shadow-xs',
  },
  {
    id: 'proud',
    emoji: '🌸',
    label: '뿌듯함',
    subtext: '나를 칭찬하고 싶은 날',
    color: 'bg-pink-50 border-pink-300 text-pink-900',
    activeBg: 'bg-pink-600 text-white border-pink-600 shadow-xs',
  },
  {
    id: 'exhausted',
    emoji: '🍂',
    label: '지침·방전',
    subtext: '에너지가 바닥난 날',
    color: 'bg-orange-50 border-orange-300 text-orange-900',
    activeBg: 'bg-orange-600 text-white border-orange-600 shadow-xs',
  },
  {
    id: 'anxious',
    emoji: '🌧️',
    label: '불안·초조',
    subtext: '마음이 조마조마한 날',
    color: 'bg-sky-50 border-sky-300 text-sky-900',
    activeBg: 'bg-sky-700 text-white border-sky-700 shadow-xs',
  },
  {
    id: 'upset',
    emoji: '⚡',
    label: '억울·속상',
    subtext: '상처나 속상함이 남은 날',
    color: 'bg-rose-50 border-rose-300 text-rose-900',
    activeBg: 'bg-rose-700 text-white border-rose-700 shadow-xs',
  },
  {
    id: 'numb',
    emoji: '😶',
    label: '공허·무기력',
    subtext: '멍하니 쉬고 싶은 날',
    color: 'bg-stone-100 border-stone-300 text-stone-900',
    activeBg: 'bg-stone-700 text-white border-stone-700 shadow-xs',
  },
];

const QUICK_TAG_SUGGESTIONS = [
  '#아이들미소',
  '#정시퇴근',
  '#수업성공',
  '#동료와티타임',
  '#민원방어',
  '#에너지충전',
  '#나를위한휴식',
  '#조용한저녁',
  '#마음다스리기',
];

const DAILY_CARDS = [
  {
    quote: "완벽한 교사가 되려 애쓰지 마세요. 오늘 하루 아이들 곁을 묵묵히 지켜준 것만으로도 선생님은 이미 충분히 좋은 어른입니다.",
    author: "토닥쌤으로부터",
  },
  {
    quote: "교실 문을 닫는 순간, 학교의 무거운 책임도 함께 내려놓으세요. 선생님에게도 다정하게 보살핌받을 권리가 있습니다.",
    author: "선배 교사의 편지",
  },
  {
    quote: "학부모의 거친 말은 선생님의 부족함 때문이 아니라, 그들의 불안과 미성숙함이 쏟아져 나온 것일 뿐입니다. 마음의 상처로 담아두지 마세요.",
    author: "마음 쉼표",
  },
  {
    quote: "아이들이 선생님의 모든 수업을 기억하진 못해도, 선생님이 건네준 따뜻한 눈빛과 미소는 평생 마음에 품고 살아갑니다.",
    author: "교육의 온기",
  },
  {
    quote: "오늘 하루도 누군가의 부모보다 더 오래 아이들을 챙기셨습니다. 고생 많으셨어요, 선생님.",
    author: "따뜻한 퇴근길",
  },
];

export const MindfulSanctuary: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'emotion_diary' | 'lock_ritual' | 'breathing' | 'gratitude_box'>('emotion_diary');

  // ==========================================
  // 1. Emotion Diary State
  // ==========================================
  const [selectedMoodId, setSelectedMoodId] = useState<string>('comforted');
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryContent, setDiaryContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['#나를위한휴식']);
  const [diaryEntries, setDiaryEntries] = useState<EmotionDiaryEntry[]>([]);
  const [filterMoodId, setFilterMoodId] = useState<string>('all');
  const [isSavingDiary, setIsSavingDiary] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch diary entries from backend API
  const fetchDiaryEntries = async () => {
    try {
      const res = await fetch('/api/records/diary');
      if (res.ok) {
        const data = await res.json();
        setDiaryEntries(data);
      }
    } catch (e) {
      console.warn('Failed to load server diary entries', e);
    }
  };

  useEffect(() => {
    fetchDiaryEntries();
  }, []);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 4) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleSaveEmotionDiary = async () => {
    if (!diaryContent.trim()) {
      alert('오늘의 감정이나 나에게 건네는 한 줄을 적어주세요.');
      return;
    }

    setIsSavingDiary(true);
    const moodPreset = EMOTION_PRESETS.find((p) => p.id === selectedMoodId) || EMOTION_PRESETS[0];
    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

    const newRecord = {
      date: dateStr,
      time: timeStr,
      title: diaryTitle.trim() || `${moodPreset.emoji} ${moodPreset.label}의 기록`,
      content: diaryContent.trim(),
      mood: moodPreset.label,
      emoji: moodPreset.emoji,
      tags: selectedTags,
    };

    try {
      const res = await fetch('/api/records/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });

      if (!res.ok) throw new Error('저장 실패');

      await fetchDiaryEntries();
      setDiaryTitle('');
      setDiaryContent('');
      playChime();
      showToast('선생님의 오늘의 감정 일기가 백엔드 서버에 안전하게 기록되었습니다.');
    } catch (err) {
      console.error(err);
      showToast('일기 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSavingDiary(false);
    }
  };

  const handleDeleteDiaryEntry = async (id: string) => {
    if (!window.confirm('이 감정 일기를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/records/diary/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDiaryEntries((prev) => prev.filter((d) => d.id !== id));
        showToast('일기가 삭제되었습니다.');
      }
    } catch (err) {
      showToast('삭제 중 오류가 발생했습니다.');
    }
  };

  // ==========================================
  // 2. Lock Ritual State
  // ==========================================
  const [burdens, setBurdens] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimestamp, setLockTimestamp] = useState<string | null>(null);

  // ==========================================
  // 3. Breathing State (4-7-8 method)
  // ==========================================
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'들이마시기' | '멈추기' | '내쉬기'>('들이마시기');
  const [countdown, setCountdown] = useState(4);
  const [cycleCount, setCycleCount] = useState(0);

  // ==========================================
  // 4. Gratitude / Reward Bank State
  // ==========================================
  const [gratitudeList, setGratitudeList] = useState<GratitudeItem[]>(() => {
    try {
      const saved = localStorage.getItem('todak_teacher_gratitude');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'sample-1',
        date: new Date().toLocaleDateString('ko-KR'),
        text: '오늘 00이가 먼저 다가와서 "선생님 오늘 예뻐요/멋져요"라고 웃어주었다.',
      },
      {
        id: 'sample-2',
        date: new Date().toLocaleDateString('ko-KR'),
        text: '수업 시간에 유난히 눈을 반짝이며 고개를 끄덕이던 아이들의 표정을 보았다.',
      },
    ];
  });
  const [newGratitudeText, setNewGratitudeText] = useState('');

  // Daily Card
  const [cardIndex, setCardIndex] = useState(0);
  const [cardCopied, setCardCopied] = useState(false);

  useEffect(() => {
    const day = new Date().getDate();
    setCardIndex(day % DAILY_CARDS.length);
  }, []);

  // Breathing timer loop
  useEffect(() => {
    if (!isBreathingActive) return;

    let timer: NodeJS.Timeout;

    if (countdown > 1) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else {
      if (breathPhase === '들이마시기') {
        setBreathPhase('멈추기');
        setCountdown(7);
      } else if (breathPhase === '멈추기') {
        setBreathPhase('내쉬기');
        setCountdown(8);
      } else {
        setBreathPhase('들이마시기');
        setCountdown(4);
        setCycleCount((c) => c + 1);
        playChime();
      }
    }

    return () => clearTimeout(timer);
  }, [isBreathingActive, countdown, breathPhase]);

  // Lock ritual handler
  const handleLockBurdens = () => {
    if (!burdens.trim()) return;
    setIsLocked(true);
    setLockTimestamp(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    playChime();
  };

  const handleResetLock = () => {
    setIsLocked(false);
    setBurdens('');
    setLockTimestamp(null);
  };

  // Gratitude list handlers
  const handleAddGratitude = () => {
    if (!newGratitudeText.trim()) return;
    const newItem: GratitudeItem = {
      id: `gratitude-${Date.now()}`,
      date: new Date().toLocaleDateString('ko-KR'),
      text: newGratitudeText.trim(),
    };
    const updated = [newItem, ...gratitudeList];
    setGratitudeList(updated);
    localStorage.setItem('todak_teacher_gratitude', JSON.stringify(updated));
    setNewGratitudeText('');
    playChime();
  };

  const handleDeleteGratitude = (id: string) => {
    const updated = gratitudeList.filter((g) => g.id !== id);
    setGratitudeList(updated);
    localStorage.setItem('todak_teacher_gratitude', JSON.stringify(updated));
  };

  const handleCopyCard = () => {
    const currentCard = DAILY_CARDS[cardIndex];
    navigator.clipboard.writeText(`"${currentCard.quote}" - ${currentCard.author}`);
    setCardCopied(true);
    setTimeout(() => setCardCopied(false), 2000);
  };

  const currentPreset = EMOTION_PRESETS.find((p) => p.id === selectedMoodId) || EMOTION_PRESETS[0];

  const filteredDiaryEntries = diaryEntries.filter((e) => {
    if (filterMoodId === 'all') return true;
    const targetPreset = EMOTION_PRESETS.find((p) => p.id === filterMoodId);
    return e.mood === targetPreset?.label || e.emoji === targetPreset?.emoji;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2 border border-stone-700 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-teal-800/80 rounded-lg text-teal-200">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">퇴근 의식 & 마음 비우기 쉼터</h2>
          </div>
          <p className="text-sm text-teal-100/90 leading-relaxed max-w-2xl">
            학교 문을 나서는 순간, 교실 안의 긴장과 걱정도 함께 내려놓으세요.
            오늘의 감정을 이모지로 간단히 기록하고 온전한 선생님의 저녁을 위한 4가지 마음 쉼표입니다.
          </p>
        </div>

        {/* Sub-tab selection */}
        <div className="flex bg-teal-950/50 p-1 rounded-xl shrink-0 border border-teal-700/40 overflow-x-auto max-w-full scrollbar-none gap-1">
          <button
            onClick={() => setActiveSubTab('emotion_diary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'emotion_diary'
                ? 'bg-white text-teal-950 shadow-sm font-bold'
                : 'text-teal-200 hover:text-white'
            }`}
          >
            <span>📖</span>
            <span>오늘의 감정 일기</span>
          </button>
          <button
            onClick={() => setActiveSubTab('lock_ritual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'lock_ritual'
                ? 'bg-white text-teal-950 shadow-sm font-bold'
                : 'text-teal-200 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>학교 문 닫기 의식</span>
          </button>
          <button
            onClick={() => setActiveSubTab('breathing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'breathing'
                ? 'bg-white text-teal-950 shadow-sm font-bold'
                : 'text-teal-200 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>4-7-8 이완 호흡</span>
          </button>
          <button
            onClick={() => setActiveSubTab('gratitude_box')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'gratitude_box'
                ? 'bg-white text-teal-950 shadow-sm font-bold'
                : 'text-teal-200 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>보람 & 칭찬 저금통</span>
          </button>
        </div>
      </div>

      {/* Daily Affirmation Card */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <BookHeart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              오늘의 위로 엽서
            </p>
            <p className="text-sm font-serif italic text-stone-800 mt-0.5">
              "{DAILY_CARDS[cardIndex].quote}"
            </p>
            <p className="text-xs text-stone-500 mt-1">— {DAILY_CARDS[cardIndex].author}</p>
          </div>
        </div>

        <button
          onClick={handleCopyCard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 text-amber-900 rounded-xl text-xs hover:bg-amber-100/50 transition-colors shrink-0 shadow-2xs"
        >
          {cardCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>복사됨</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-amber-700" />
              <span>문구 복사</span>
            </>
          )}
        </button>
      </div>

      {/* ========================================== */}
      {/* Sub-tab 1: Today's Emotion Diary (NEW!)     */}
      {/* ========================================== */}
      {activeSubTab === 'emotion_diary' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Emotion Diary Writer (Left 5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <div>
                  <h3 className="text-base font-bold text-stone-900">오늘의 감정 일기</h3>
                  <p className="text-xs text-stone-500">
                    상담 전후, 오늘 교실에서 스친 감정을 이모지로 남겨보세요.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-stone-400 bg-stone-50 px-2 py-1 rounded-md border border-stone-200">
                {new Date().toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', weekday: 'short' })}
              </span>
            </div>

            {/* 1. Emoji Mood Picker */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-2">
                오늘 하루를 가장 잘 나타내는 감정 이모지 선택
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EMOTION_PRESETS.map((item) => {
                  const isSelected = selectedMoodId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedMoodId(item.id);
                        playChime();
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? item.activeBg + ' ring-2 ring-emerald-600/30 scale-105'
                          : item.color + ' hover:scale-102'
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="text-xs font-bold mt-0.5">{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-stone-500 mt-2 flex items-center gap-1">
                <span className="font-semibold text-stone-700">선택된 상태:</span>
                <span>{currentPreset.emoji} {currentPreset.label} — {currentPreset.subtext}</span>
              </p>
            </div>

            {/* 2. Quick Keyword Tags */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                오늘의 상황 태그 (최대 4개)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAG_SUGGESTIONS.map((tag) => {
                  const isTagActive = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        isTagActive
                          ? 'bg-emerald-800 text-white border-emerald-800 font-semibold'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Diary Reflection Content */}
            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                나에게 건네는 한 줄 위로 & 감정 성찰
              </label>
              <textarea
                rows={4}
                value={diaryContent}
                onChange={(e) => setDiaryContent(e.target.value)}
                placeholder="예: 오늘 5교시에 조금 힘들었지만 아이들과 웃으며 끝마쳤다. 퇴근길에는 따뜻한 라떼를 사 마시며 나를 칭찬해주어야지."
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-emerald-600 resize-none placeholder-stone-400"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSaveEmotionDiary}
              disabled={isSavingDiary || !diaryContent.trim()}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              <span>{isSavingDiary ? '서버에 보관 중...' : '오늘의 감정 일기 저장하기'}</span>
            </button>
          </div>

          {/* Emotion Diary Timeline & History (Right 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              {/* Header & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-200 gap-3">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    선생님의 누적 감정 일기장 ({diaryEntries.length}편)
                  </h4>
                  <p className="text-xs text-stone-500">
                    그날의 감정을 돌아보며 나만의 마음 리듬을 발견해 보세요.
                  </p>
                </div>

                {/* Mood Filter */}
                <div className="flex items-center gap-1 overflow-x-auto text-[11px] scrollbar-none">
                  <span className="text-stone-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> 필터:
                  </span>
                  <button
                    onClick={() => setFilterMoodId('all')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      filterMoodId === 'all'
                        ? 'bg-emerald-800 text-white font-bold'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    전체
                  </button>
                  {EMOTION_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFilterMoodId(p.id)}
                      className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-0.5 ${
                        filterMoodId === p.id
                          ? 'bg-emerald-800 text-white font-bold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      <span>{p.emoji}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Diary Stream */}
              <div className="mt-3 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredDiaryEntries.length > 0 ? (
                  filteredDiaryEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-stone-50/70 hover:bg-stone-50 rounded-xl border border-stone-200/90 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{entry.emoji || '🌿'}</span>
                          <span className="font-bold text-stone-900 text-xs">
                            {entry.mood}
                          </span>
                          <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-stone-400" />
                            {entry.date} {entry.time ? `(${entry.time})` : ''}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteDiaryEntry(entry.id)}
                          className="text-stone-400 hover:text-red-500 p-1 rounded-lg transition-colors"
                          title="일기 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {entry.title && entry.title !== entry.mood && (
                        <h5 className="text-xs font-bold text-stone-800">{entry.title}</h5>
                      )}

                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-serif whitespace-pre-wrap">
                        {entry.content}
                      </p>

                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {entry.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-white text-emerald-800 px-2 py-0.5 rounded-md border border-stone-200"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-stone-400 text-xs">
                    기록된 감정 일기가 없습니다. 좌측에서 오늘의 감정을 이모지와 함께 남겨보세요.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
              <span>* 선생님의 모든 감정은 소중하며, 그 어떤 감정도 틀리지 않습니다.</span>
              <span className="text-emerald-800 font-semibold">100% 안심 프라이버시</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Sub-tab 2: School Close Lock Ritual        */}
      {/* ========================================== */}
      {activeSubTab === 'lock_ritual' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm max-w-2xl mx-auto">
          {!isLocked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
                <Lock className="w-5 h-5 text-emerald-800" />
                <div>
                  <h3 className="text-base font-bold text-stone-900">학교 문 닫기 가상 의식</h3>
                  <p className="text-xs text-stone-500">
                    퇴근 전, 오늘 학교에서 마음에 걸렸던 잔상들을 이곳에 적고 가상 보관함에 봉인하세요.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                  오늘 나를 속상하고 힘들게 했던 생각들 (잡무, 학부모 말 한마디, 교실 소음 등)
                </label>
                <textarea
                  rows={4}
                  value={burdens}
                  onChange={(e) => setBurdens(e.target.value)}
                  placeholder="예: 오늘 학부모님의 쌀쌀맞은 말투가 자꾸 떠올라요... 끝내지 못한 공문 때문에 퇴근해서도 찝찝해요..."
                  className="w-full text-xs sm:text-sm p-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:border-emerald-600 focus:outline-none resize-none placeholder-stone-400"
                />
              </div>

              <button
                onClick={handleLockBurdens}
                disabled={!burdens.trim()}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Lock className="w-4 h-4" />
                <span>가상 보관함에 넣고 자물쇠 잠그기</span>
              </button>

              <p className="text-center text-[11px] text-stone-400">
                * 작성하신 내용은 서버에 저장되지 않으며, 잠그는 순간 안전하게 격리됩니다.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                <Lock className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {lockTimestamp} 학교 문이 완전히 닫혔습니다
                </span>
                <h3 className="text-xl font-bold text-stone-900 font-serif">
                  "오늘의 일은 학교에 모두 남겨두었습니다."
                </h3>
                <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed pt-2">
                  선생님, 오늘 하루도 참 많은 짐을 지탱하셨습니다.
                  이제 교실 문을 잠그듯 마음속 학교 문도 굳게 잠그세요. 
                  지금부터 내일 출근 전까지는 오롯이 선생님 자신만을 위한 시간입니다.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  onClick={handleResetLock}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-colors"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>새로운 의식 준비하기</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* Sub-tab 3: 4-7-8 Breathing Circle          */}
      {/* ========================================== */}
      {activeSubTab === 'breathing' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 shadow-sm max-w-xl mx-auto text-center">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-stone-900">4-7-8 긴급 이완 호흡</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              학부모 상담 후 심장이 떨리거나, 수업 후 두통이 올 때 자율신경계를 즉각 안정시키는 호흡법입니다.
            </p>
          </div>

          <div className="relative w-56 h-56 mx-auto my-6 flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full border-4 border-emerald-200 transition-all duration-1000 ${
                isBreathingActive
                  ? breathPhase === '들이마시기'
                    ? 'scale-110 bg-emerald-50/50'
                    : breathPhase === '멈추기'
                    ? 'scale-110 bg-amber-50/50 border-amber-200'
                    : 'scale-90 bg-teal-50/50 border-teal-200'
                  : 'scale-100 bg-stone-50'
              }`}
            />

            <div className="relative z-10 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                {isBreathingActive ? breathPhase : '호흡 시작 대기'}
              </p>
              <p className="text-4xl font-extrabold text-stone-900 font-mono">
                {isBreathingActive ? countdown : '준비'}
              </p>
              <p className="text-[11px] text-stone-400">
                {isBreathingActive ? `완료된 사이클: ${cycleCount}회` : '편안히 의자에 기대세요'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            {!isBreathingActive ? (
              <button
                onClick={() => {
                  setIsBreathingActive(true);
                  setBreathPhase('들이마시기');
                  setCountdown(4);
                  playChime();
                }}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center gap-2"
              >
                <Wind className="w-4 h-4" />
                <span>호흡 가이드 시작하기</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsBreathingActive(false);
                  setCycleCount(0);
                }}
                className="px-6 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-sm font-medium transition-colors"
              >
                호흡 멈추기
              </button>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-stone-200 text-xs text-stone-500 space-y-1">
            <p>1. 코로 조용히 4초 동안 숨을 들이마십니다.</p>
            <p>2. 7초 동안 숨을 편안히 멈춥니다.</p>
            <p>3. 입으로 '후-' 소리를 내며 8초 동안 길게 내쉽니다.</p>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Sub-tab 4: Gratitude & Reward Bank         */}
      {/* ========================================== */}
      {activeSubTab === 'gratitude_box' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <div>
                <h3 className="text-base font-bold text-stone-900">선생님 보람 & 칭찬 저금통</h3>
                <p className="text-xs text-stone-500">
                  힘든 날 꺼내보는 소소한 아이들의 미소와 작은 성취 기록
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                오늘 교실에서 발견한 소소한 보람이나 감사했던 순간
              </label>
              <textarea
                rows={4}
                value={newGratitudeText}
                onChange={(e) => setNewGratitudeText(e.target.value)}
                placeholder="예: 말썽꾸러기 00이가 오늘은 친구에게 양보를 먼저 해주었다. 급식 지도 때 맛있게 먹는 아이들의 웃음소리가 귀여웠다."
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:border-emerald-600 focus:outline-none resize-none placeholder-stone-400"
              />
            </div>

            <button
              onClick={handleAddGratitude}
              disabled={!newGratitudeText.trim()}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              <span>마음 저금통에 저금하기</span>
            </button>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
                <span className="text-xs font-semibold text-stone-500">
                  내가 모아둔 소중한 보람들 ({gratitudeList.length}개)
                </span>
                <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  지친 날 꺼내보세요
                </span>
              </div>

              {gratitudeList.length > 0 ? (
                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {gratitudeList.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start justify-between gap-3 text-xs leading-relaxed text-stone-800"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono text-stone-400">{item.date}</span>
                        <p className="text-stone-800">{item.text}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteGratitude(item.id)}
                        className="text-stone-400 hover:text-red-500 p-1 rounded-lg transition-colors shrink-0"
                        title="기록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-stone-400 text-xs">
                  아직 저금된 보람이 없습니다. 왼쪽에서 작은 순간을 기록해 보세요.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] text-stone-500">
              * 아이들의 작은 눈빛 하나도 선생님이 심어준 사랑의 씨앗입니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

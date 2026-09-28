import React, { useState, useEffect } from 'react';
import { BURNOUT_QUESTIONS, ANSWER_CHOICES } from '../data/burnoutQuestions';
import { BurnoutResult } from '../types';
import { 
  HeartHandshake, 
  Sparkles, 
  FileText, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  Printer, 
  Share2,
  Calendar,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { playChime } from '../utils/audio';

const STORAGE_KEY = 'todak_burnout_latest_result';

export const BurnoutAssessment: React.FC = () => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentStep, setCurrentStep] = useState(0); // 0 to 6
  const [result, setResult] = useState<BurnoutResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load past result', e);
    }
    return null;
  });

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const totalQuestions = BURNOUT_QUESTIONS.length;
  const currentQuestion = BURNOUT_QUESTIONS[currentStep];

  const handleSelectScore = (score: number) => {
    const updated = { ...answers, [currentQuestion.id]: score };
    setAnswers(updated);

    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate final score
      calculateAndShowResult(updated);
    }
  };

  const calculateAndShowResult = (allAnswers: Record<number, number>) => {
    let totalScore = 0;
    let exhaustionScore = 0;
    let depersonalizationScore = 0;
    let achievementScore = 0;

    BURNOUT_QUESTIONS.forEach((q) => {
      const s = allAnswers[q.id] || 0;
      totalScore += s;
      if (q.category === 'exhaustion') exhaustionScore += s;
      if (q.category === 'depersonalization') depersonalizationScore += s;
      if (q.category === 'reducedAchievement') achievementScore += s;
    });

    let level: BurnoutResult['level'] = '안정';
    if (totalScore >= 20) {
      level = '심각한 소진';
    } else if (totalScore >= 13) {
      level = '경계';
    } else if (totalScore >= 7) {
      level = '주의';
    } else {
      level = '안정';
    }

    const calculated: BurnoutResult = {
      score: totalScore,
      totalMax: totalQuestions * 4,
      level,
      exhaustionScore,
      depersonalizationScore,
      achievementScore,
      date: new Date().toLocaleDateString('ko-KR'),
    };

    setResult(calculated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calculated));
    playChime();

    // Sync to backend server
    fetch('/api/records/burnout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `burnout-${Date.now()}`,
        ...calculated,
      }),
    }).catch((e) => console.warn('Burnout server sync failed', e));
  };

  const handleFetchAiPrescription = async () => {
    if (!result) return;
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const res = await fetch('/api/burnout-prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: result.score,
          level: result.level,
          categoryScores: {
            exhaustion: result.exhaustionScore,
            depersonalization: result.depersonalizationScore,
            reducedAchievement: result.achievementScore,
          },
          answers,
        }),
      });

      if (!res.ok) {
        throw new Error('처방 편지 요청 실패');
      }

      const data = await res.json();
      const updatedResult: BurnoutResult = {
        ...result,
        aiPrescription: data,
      };

      setResult(updatedResult);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResult));
      playChime();

      // Sync updated result with AI prescription to backend server
      fetch('/api/records/burnout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `burnout-${Date.now()}`,
          ...updatedResult,
        }),
      }).catch((e) => console.warn('Burnout prescription server sync failed', e));
    } catch (err: any) {
      console.error('Prescription fetch error:', err);
      setAiError('AI 맞춤 처방 편지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleRetest = () => {
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
  };

  const getLevelBadge = (lvl: BurnoutResult['level']) => {
    switch (lvl) {
      case '안정':
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />,
          title: '초록 신호 (마음 안정)',
          desc: '정서적으로 균형을 유지하고 계십니다. 지금처럼 나를 위한 시간을 틈틈이 확보해 주세요.',
        };
      case '주의':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-700" />,
          title: '노랑 신호 (피로 누적)',
          desc: '가벼운 소진 신호가 감지됩니다. 주말에는 학교 업무와 철저히 분리된 휴식이 필요합니다.',
        };
      case '경계':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: <Flame className="w-4 h-4 text-orange-700" />,
          title: '주황 신호 (소진 시작)',
          desc: '에너지가 바닥나 자책감과 회의감이 커지는 단계입니다. 주변의 지지와 단호한 업무 경계선 설정이 시급합니다.',
        };
      case '심각한 소진':
        return {
          color: 'bg-red-100 text-red-800 border-red-300',
          icon: <ShieldAlert className="w-4 h-4 text-red-700" />,
          title: '빨강 신호 (심각한 번아웃)',
          desc: '신체적·정신적으로 한계에 도달했습니다. 선생님 잘못이 아닙니다. 병가, 전문 상담, 또는 교육청 교원치유센터의 적극적 도움이 필요합니다.',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-stone-800 to-amber-900 text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 bg-amber-700/60 rounded-lg text-amber-200">
            <HeartHandshake className="w-5 h-5" />
          </span>
          <h2 className="text-xl font-bold">선생님 마음 건강 & 번아웃(소진) 진단</h2>
        </div>
        <p className="text-sm text-stone-200 leading-relaxed max-w-2xl">
          교사는 아이들의 마음을 보살피느라 정작 자신의 마음이 무너지는 것을 가장 늦게 알아차립니다.
          MBI-Educators 기반 7문항으로 나의 현재 심리적 탈진도를 점검하고 따뜻한 회복 처방을 받아보세요.
        </p>
      </div>

      {!result ? (
        /* Question Form */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm max-w-2xl mx-auto">
          {/* Progress header */}
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span className="font-semibold text-emerald-800">
              질문 {currentStep + 1} / {totalQuestions}
            </span>
            <span className="text-[11px] bg-stone-100 px-2 py-0.5 rounded-full">
              {currentQuestion.categoryName}
            </span>
          </div>

          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mb-6">
            <div
              className="bg-emerald-700 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          {/* Current Question */}
          <div className="py-4">
            <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug min-h-[56px]">
              "{currentQuestion.question}"
            </h3>
          </div>

          {/* Choices */}
          <div className="space-y-2.5 mt-6">
            {ANSWER_CHOICES.map((choice) => {
              const isSelected = answers[currentQuestion.id] === choice.score;
              return (
                <button
                  key={choice.score}
                  onClick={() => handleSelectScore(choice.score)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600 shadow-xs'
                      : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 text-stone-700'
                  }`}
                >
                  <span>{choice.label}</span>
                  <span className="text-xs text-stone-400 font-mono">+{choice.score}점</span>
                </button>
              );
            })}
          </div>

          {/* Back button */}
          {currentStep > 0 && (
            <div className="mt-6 pt-4 border-t border-stone-200 flex justify-start">
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>이전 질문으로</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Result Screen */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    진단일: {result.date}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-stone-900">
                  선생님의 번아웃 진단 결과 리포트
                </h3>
              </div>

              <button
                onClick={handleRetest}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors self-start"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>다시 검사하기</span>
              </button>
            </div>

            {/* Score & Level Highlight */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 items-center">
              <div className="md:col-span-4 bg-stone-50 rounded-2xl p-6 text-center border border-stone-200">
                <p className="text-xs font-medium text-stone-500">종합 소진 점수</p>
                <div className="text-4xl font-extrabold text-stone-900 mt-2 font-mono">
                  {result.score}
                  <span className="text-base font-normal text-stone-400"> / {result.totalMax}</span>
                </div>
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      getLevelBadge(result.level).color
                    }`}
                  >
                    {getLevelBadge(result.level).icon}
                    {result.level} 단계
                  </span>
                </div>
              </div>

              <div className="md:col-span-8 space-y-3">
                <h4 className="text-base font-bold text-stone-900">
                  {getLevelBadge(result.level).title}
                </h4>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {getLevelBadge(result.level).desc}
                </p>

                {/* Subscale breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <p className="text-[11px] text-stone-500">정서적 고갈</p>
                    <p className="text-sm font-bold text-stone-800 mt-1">{result.exhaustionScore} / 12점</p>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <p className="text-[11px] text-stone-500">거리두기·냉담화</p>
                    <p className="text-sm font-bold text-stone-800 mt-1">{result.depersonalizationScore} / 8점</p>
                  </div>
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                    <p className="text-[11px] text-stone-500">개인 성취감 저하</p>
                    <p className="text-sm font-bold text-stone-800 mt-1">{result.achievementScore} / 8점</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Prescription Action Button */}
            {!result.aiPrescription && (
              <div className="mt-6 p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center">
                <Sparkles className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                <h4 className="text-base font-bold text-emerald-950">
                  선생님만을 위한 AI 맞춤 처방 편지 & 회복 루틴
                </h4>
                <p className="text-xs text-emerald-800 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                  진단 결과와 현재 마음 상태를 바탕으로, 지친 선생님의 마음을 위로하고 오늘 당장 실천할 수 있는 소소한 처방전을 작성해 드립니다.
                </p>
                <button
                  onClick={handleFetchAiPrescription}
                  disabled={isLoadingAi}
                  className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-bold transition-all shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoadingAi ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>처방 편지를 정성껏 적고 있습니다...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>맞춤 위로 편지 & 처방전 받아보기</span>
                    </>
                  )}
                </button>
                {aiError && <p className="text-xs text-red-600 mt-2">{aiError}</p>}
              </div>
            )}
          </div>

          {/* AI Prescription Result Card */}
          {result.aiPrescription && (
            <div className="bg-stone-50 rounded-2xl border border-stone-300/80 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-start justify-between border-b border-stone-200 pb-4">
                <div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                    선생님을 위한 마음 처방전
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-stone-900 mt-2 font-serif">
                    {result.aiPrescription.letterTitle}
                  </h3>
                </div>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-xl text-xs hover:bg-stone-100 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>인쇄하기</span>
                </button>
              </div>

              {/* Heartfelt Warm Letter */}
              <div className="bg-white rounded-xl p-6 border border-stone-200 text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-serif shadow-xs">
                {result.aiPrescription.warmLetter}
              </div>

              {/* 3 Practical Micro Actions */}
              <div>
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  선생님을 위한 3가지 작은 회복 처방
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.aiPrescription.prescriptions.map((presc, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-emerald-800 block mb-1">
                          처방 0{idx + 1}. {presc.title}
                        </span>
                        <p className="text-xs text-stone-600 leading-relaxed">{presc.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comfort Quote Banner */}
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-xl p-5 text-center shadow-xs">
                <p className="text-xs text-emerald-200 mb-1">선생님께 건네는 오늘의 위로</p>
                <p className="text-sm sm:text-base font-bold italic">
                  "{result.aiPrescription.comfortQuote}"
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { COMMUNICATION_TEMPLATES } from '../data/templates';
import { CommunicationTemplate } from '../types';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  AlertCircle,
  Clock,
  BookOpen,
  Send,
  MessageSquare
} from 'lucide-react';

export const CommunicationHelper: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'ai_generator'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate>(COMMUNICATION_TEMPLATES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Generator state
  const [customSituation, setCustomSituation] = useState('학부모님의 지나친 간섭 및 무리한 요구 대응');
  const [details, setDetails] = useState('');
  const [tone, setTone] = useState<'firm_polite' | 'warm_empathetic' | 'objective_official'>('firm_polite');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    draft: string;
    pointExplanation: string;
    teacherAdvice: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateCustom = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situationType: customSituation,
          details,
          tone,
        }),
      });

      if (!res.ok) {
        throw new Error('문구 생성 요청에 실패했습니다.');
      }

      const data = await res.json();
      setGeneratedResult(data);
    } catch (err: any) {
      console.error('Generator error:', err);
      setErrorMsg('문구 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-emerald-700/60 rounded-lg text-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">교권 안심 & 학부모 소통 도우미</h2>
          </div>
          <p className="text-sm text-emerald-100/90 leading-relaxed max-w-2xl">
            가슴 뛰고 손 떨리는 어려운 순간, 선생님의 감정 소모를 막고 법적·교육적 원칙을 지켜주는 공식 답변 문구를 제공합니다.
            혼자 고민하며 상처받지 마세요.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-emerald-950/40 p-1 rounded-xl shrink-0 border border-emerald-700/40">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'templates'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-200 hover:text-white'
            }`}
          >
            표준 대응 템플릿
          </button>
          <button
            onClick={() => setActiveTab('ai_generator')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              activeTab === 'ai_generator'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-200 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            AI 맞춤 문구 생성
          </button>
        </div>
      </div>

      {/* Mode 1: Standard Verified Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Template List (Left) */}
          <div className="lg:col-span-4 space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2 px-1">
              상황별 표준 템플릿
            </h3>
            {COMMUNICATION_TEMPLATES.map((item) => {
              const isSelected = selectedTemplate.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedTemplate(item)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-600'
                      : 'bg-white/80 hover:bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-4 h-4 text-emerald-700" />}
                  </div>
                  <h4 className="text-sm font-semibold text-stone-900 mt-1">{item.title}</h4>
                  <p className="text-xs text-stone-500 line-clamp-1">{item.situation}</p>
                </button>
              );
            })}
          </div>

          {/* Template Viewer (Right) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200">
                <div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {selectedTemplate.category}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 mt-2">{selectedTemplate.title}</h3>
                  <p className="text-xs text-stone-500 mt-1">{selectedTemplate.situation}</p>
                </div>

                <button
                  onClick={() => handleCopy(selectedTemplate.id, selectedTemplate.defaultDraft)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium transition-colors shrink-0 shadow-xs"
                >
                  {copiedId === selectedTemplate.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>문구 복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editable/Preview draft container */}
              <div className="mt-5">
                <label className="text-xs font-semibold text-stone-700 block mb-2">
                  추천 공식 답변문 (알림장, 문자, 메신저용)
                </label>
                <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-stone-800 text-sm leading-relaxed whitespace-pre-wrap font-sans select-all">
                  {selectedTemplate.defaultDraft}
                </div>
              </div>

              {/* Practical Teacher Protection Tip */}
              <div className="mt-5 bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-semibold mb-1">선생님을 지키는 소통 팁</p>
                  <p className="leading-relaxed">{selectedTemplate.tips}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                정규 근무시간 외 긴급하지 않은 연락은 익일 답변이 원칙입니다.
              </span>
              <button
                onClick={() => {
                  setCustomSituation(selectedTemplate.title);
                  setActiveTab('ai_generator');
                }}
                className="text-emerald-800 font-medium hover:underline inline-flex items-center gap-1"
              >
                이 상황으로 AI 맞춤 생성하기
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: AI Dynamic Response Generator */}
      {activeTab === 'ai_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form (Left) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="text-base font-bold text-stone-900">상황별 맞춤 문구 생성기</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                겪고 계신 난감한 상황
              </label>
              <select
                value={customSituation}
                onChange={(e) => setCustomSituation(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:border-emerald-600 focus:outline-none"
              >
                <option value="학부모님의 지나친 간섭 및 무리한 요구 대응">학부모님의 지나친 간섭 및 무리한 요구 대응</option>
                <option value="야간·주말 사적인 연락에 대한 선 긋기">야간·주말 사적인 연락에 대한 선 긋기</option>
                <option value="학생 간 학교폭력/다툼 발생 시 중립적 안내">학생 간 학교폭력/다툼 발생 시 중립적 안내</option>
                <option value="수업 방해 학생 지도 및 학부모 면담 요청">수업 방해 학생 지도 및 학부모 면담 요청</option>
                <option value="수행평가/지필평가 점수 항의에 대한 원칙 안내">수행평가/지필평가 점수 항의에 대한 원칙 안내</option>
                <option value="기타 직접 작성">기타 상황 (아래에 상세 내용 입력)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                상황의 구체적 내용 (핵심만 적어주셔도 됩니다)
              </label>
              <textarea
                rows={4}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="예: 아이가 오늘 다른 아이의 물건을 망가뜨렸는데, 학부모님은 우리 아이 탓이 아니라고 화를 내시며 전화를 끊으셨습니다. 어떻게 문자를 남겨야 할까요?"
                className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:border-emerald-600 focus:outline-none resize-none placeholder-stone-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                원하는 소통 어조 (Tone)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'firm_polite', label: '단호하고 정중', desc: '교권 보호형' },
                  { id: 'warm_empathetic', label: '따뜻한 공감', desc: '불안 완화형' },
                  { id: 'objective_official', label: '객관적 공문형', desc: '원칙/규정 중심' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      tone === t.id
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateCustom}
              disabled={isGenerating}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>선생님을 지키는 문구 다듬는 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>안전한 소통 문구 생성하기</span>
                </>
              )}
            </button>

            {errorMsg && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Output Display (Right) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            {generatedResult ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-stone-200">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      AI 맞춤 생성 결과
                    </span>
                    <h3 className="text-base font-bold text-stone-900 mt-1.5">
                      {generatedResult.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy('custom-ai', generatedResult.draft)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium transition-colors shrink-0 shadow-xs"
                  >
                    {copiedId === 'custom-ai' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>복사 완료</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>전체 복사</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1.5">
                    추천 답변 문구 (바로 활용 가능)
                  </label>
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-stone-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-all">
                    {generatedResult.draft}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <p className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      이 문구가 교사를 보호하는 이유
                    </p>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {generatedResult.pointExplanation}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <p className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                      선생님을 위한 마인드셋 조언
                    </p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {generatedResult.teacherAdvice}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-stone-800 mb-1">
                  선생님의 상황에 맞춘 공식 문구를 만들어 드립니다
                </h4>
                <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
                  왼쪽에서 마주한 상황과 내용을 간략히 입력하신 후 '안전한 소통 문구 생성하기' 버튼을 누르시면, 상대방의 감정적 공격을 차단하는 정중한 답변문이 완성됩니다.
                </p>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
              <span>* 학생 및 학부모의 실제 실명이나 개인 식별 정보는 제외하고 입력해 주세요.</span>
              <span className="text-emerald-800 font-medium">안심 프라이버시 보호</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

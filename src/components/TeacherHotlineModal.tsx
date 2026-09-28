import React from 'react';
import { 
  X, 
  Phone, 
  ShieldAlert, 
  HeartHandshake, 
  ExternalLink, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface TeacherHotlineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherHotlineModal: React.FC<TeacherHotlineModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-red-600/80 rounded-lg text-white">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold">교원 긴급 지원망 & 위기 대응 핫라인</h3>
              <p className="text-xs text-stone-300">선생님은 혼자가 아닙니다. 공적인 도움을 받으세요.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-stone-800">
          {/* Quick Call Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              공식 교원 긴급 연락처
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">교육부 교원 핫라인</p>
                  <p className="text-lg font-extrabold text-emerald-800 font-mono">1395</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    교육활동 침해 사안 신고 및 원스톱 법률·심리 지원
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <HeartHandshake className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">시·도 교육청 교원치유지원센터</p>
                  <p className="text-xs font-bold text-amber-800 mt-1">지역 교육청 대표번호</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    전문 심리상담 치료비 지원 및 교권 변호사 무료 자문
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Crisis Hotline */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>극심한 우울, 공황, 위기 상담 (24시간 전국 무료):</span>
            </div>
            <span className="font-bold font-mono text-sm bg-white px-2 py-0.5 rounded border border-rose-200">
              109 / 1577-0199
            </span>
          </div>

          {/* Action Guidelines for Malicious Inquiries */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
              악성 민원 및 폭언 마주했을 때 4대 행동 원칙
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-0.5">
                  1. 통화 녹음 고지 및 즉각 종료
                </span>
                <p className="text-stone-600 leading-relaxed">
                  "지속적인 폭언이나 부당한 요구 시 상담을 중단할 수 있습니다"를 고지하고 전화를 끊으세요. 교원은 폭언을 견뎌야 할 법적 의무가 없습니다.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-0.5">
                  2. 육하원칙에 입각한 사실 일지 작성
                </span>
                <p className="text-stone-600 leading-relaxed">
                  감정적 수식어 대신 일시, 장소, 상대방 발언, 주고받은 내용, 목격자를 있는 그대로 메모하여 증거를 남겨두세요.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-0.5">
                  3. 관리자(교감·교장) 즉각 보고
                </span>
                <p className="text-stone-600 leading-relaxed">
                  혼자서 해결하려 하지 말고 학교 관리자에게 사안을 보고하고 학교 차원의 공식 민원 대응을 공식 요청하세요.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-0.5">
                  4. 지역교권보호위원회 심의 신청
                </span>
                <p className="text-stone-600 leading-relaxed">
                  침해 행위가 중대할 경우 관할 교육지원청 지역교권보호위원회에 심의를 신청하여 법적 보호 조치를 받으세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};

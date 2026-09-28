import React, { useState } from 'react';
import { X, Check, UserCheck } from 'lucide-react';
import { TeacherProfile } from '../types';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TeacherProfile;
  onSave: (updated: TeacherProfile) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [form, setForm] = useState<TeacherProfile>(profile);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-stone-200 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-stone-900">선생님 맞춤 설정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-stone-500 leading-relaxed">
            선생님의 근무 환경에 꼭 맞는 더 섬세하고 현실적인 공감과 조언을 드릴 수 있습니다.
          </p>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              학교급
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['초등학교', '중학교', '고등학교', '유치원', '특수학교', '기타'].map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setForm({ ...form, schoolLevel: lvl as any })}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    form.schoolLevel === lvl
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-1 ring-emerald-600'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              교직 경력
            </label>
            <div className="space-y-1.5 text-xs">
              {[
                '1~3년차 (신규·저경력)',
                '4~10년차',
                '10년 이상 (중견·수석)',
              ].map((yr) => (
                <button
                  type="button"
                  key={yr}
                  onClick={() => setForm({ ...form, yearsOfService: yr as any })}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                    form.yearsOfService === yr
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-1 ring-emerald-600'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              담당 역할
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['담임교사', '교과/전담교사', '부장/보직교사', '기타'].map((role) => (
                <button
                  type="button"
                  key={role}
                  onClick={() => setForm({ ...form, roleType: role as any })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    form.roleType === role
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold ring-1 ring-emerald-600'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>저장하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

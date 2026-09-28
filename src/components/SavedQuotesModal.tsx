import React, { useState, useEffect } from 'react';
import { X, Bookmark, Trash2, Copy, Check } from 'lucide-react';

interface SavedQuote {
  id: string;
  counselorName: string;
  date: string;
  text: string;
}

interface SavedQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedQuotesModal: React.FC<SavedQuotesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = JSON.parse(localStorage.getItem('todak_comfort_saved') || '[]');
        setQuotes(saved);
      } catch {
        setQuotes([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    const updated = quotes.filter((q) => q.id !== id);
    setQuotes(updated);
    localStorage.setItem('todak_comfort_saved', JSON.stringify(updated));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200 overflow-hidden max-h-[85vh] flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
              <Bookmark className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-stone-900">선생님 마음 보관함</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3">
          {quotes.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              아직 보관된 위로 글이 없습니다. 상담 대화 중 마음에 와닿는 말에 '마음 보관' 버튼을 눌러보세요.
            </div>
          ) : (
            quotes.map((q) => (
              <div
                key={q.id}
                className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between gap-3 text-xs"
              >
                <div className="flex items-center justify-between text-stone-400 text-[11px]">
                  <span className="font-semibold text-emerald-800">{q.counselorName}</span>
                  <span>{q.date}</span>
                </div>
                <p className="text-stone-800 leading-relaxed whitespace-pre-wrap font-serif">
                  {q.text}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/60">
                  <button
                    onClick={() => handleCopy(q.id, q.text)}
                    className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800"
                  >
                    {copiedId === q.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>복사</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>삭제</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

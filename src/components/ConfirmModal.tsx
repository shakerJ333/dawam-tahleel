import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  icon?: 'trash' | 'warn' | 'help';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  details,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء وتراجع',
  isDanger = false,
  icon = 'warn',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md p-6 text-center bg-white dark:bg-[#102627] text-[#141c19] dark:text-[#e6f1ee] rounded-2xl shadow-2xl border-2 border-[#d5dfdb] dark:border-[#386062] transition-transform animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl ${
            isDanger
              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 border border-rose-300 dark:border-rose-800'
              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 border border-amber-300 dark:border-amber-800'
          }`}
        >
          {icon === 'trash' ? (
            <Trash2 className="w-7 h-7" />
          ) : icon === 'help' ? (
            <HelpCircle className="w-7 h-7" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        <h3 className="mb-2 text-xl font-bold font-reem">{title}</h3>
        <p className="mb-3 text-sm text-[#435b54] dark:text-[#9bb5b0] leading-relaxed">{message}</p>

        {details && <div className="mb-4 text-xs text-right">{details}</div>}

        <div className="flex flex-wrap-reverse items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-all hover:brightness-105 active:scale-95 ${
              isDanger
                ? 'bg-[#c4473a] hover:bg-rose-700'
                : 'bg-[#0f3d3e] dark:bg-[#165354] hover:bg-[#165354]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

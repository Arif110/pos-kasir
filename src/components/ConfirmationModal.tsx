import React from 'react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  showInputConfirmation?: boolean;
  inputPlaceholder?: string;
  inputExpectedValue?: string;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  type = 'danger',
  onConfirm,
  onCancel,
  showInputConfirmation = false,
  inputPlaceholder = 'Ketik "OK" untuk konfirmasi',
  inputExpectedValue = 'OK'
}: ConfirmationModalProps) {
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmDisabled = showInputConfirmation && inputValue !== inputExpectedValue;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      default:
        return <HelpCircle className="w-6 h-6 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-50 border-rose-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-blue-50 border-blue-100';
    }
  };

  const getConfirmButtonClass = () => {
    if (isConfirmDisabled) {
      return 'bg-slate-200 text-slate-400 cursor-not-allowed';
    }
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm hover:shadow-rose-100 cursor-pointer focus:ring-2 focus:ring-rose-500/20 transition-all';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm hover:shadow-amber-100 cursor-pointer focus:ring-2 focus:ring-amber-500/20 transition-all';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-sm hover:shadow-indigo-100 cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 animate-fadeIn"
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white border border-slate-100 w-full max-w-md rounded-2xl shadow-xl p-6 overflow-hidden animate-scaleUp z-10 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border ${getIconBg()} shrink-0 flex items-center justify-center`}>
            {getIcon()}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
          </div>
        </div>

        {showInputConfirmation && (
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Konfirmasi Ketik *
            </label>
            <input
              type="text"
              required
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 transition-all font-medium"
            />
          </div>
        )}

        <div className="flex items-center gap-3 justify-end pt-2 border-t border-slate-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-bold text-xs cursor-pointer transition-all focus:ring-2 focus:ring-slate-100 rounded-xl"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-sm flex items-center justify-center ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

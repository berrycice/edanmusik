import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types.js';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-notifications-container"
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-11/12 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-slate-900/95 text-white border-pink-500/40'
              : toast.type === 'error'
              ? 'bg-red-950/95 text-white border-red-500/40'
              : 'bg-slate-900/95 text-white border-blue-500/40'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-pink-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />}
            <p className="text-xs font-semibold tracking-tight truncate">{toast.text}</p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

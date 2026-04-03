import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS = {
  success: 'check_circle',
  error: 'cancel',
  warning: 'warning',
  info: 'info',
};

const COLORS = {
  success: 'border-emerald-500/40 text-emerald-400',
  error: 'border-red-500/40 text-red-400',
  warning: 'border-amber-500/40 text-amber-400',
  info: 'border-primary/40 text-primary',
};

function ToastItem({ id, type, message, onDismiss }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border bg-surface-card backdrop-blur-xl shadow-2xl min-w-[280px] max-w-sm ${COLORS[type]}`}
      style={{ animation: 'toast-in 0.25s ease' }}
    >
      <span className="material-symbols-outlined text-xl mt-0.5 shrink-0">{ICONS[type]}</span>
      <p className="text-sm font-medium text-text-primary flex-1 leading-snug">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="text-text-secondary hover:text-text-primary shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, type = 'info') => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const toast = {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info: (msg) => show(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(1rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

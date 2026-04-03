import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  // Returns Promise<boolean>
  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ message, type: 'confirm', ...options });
    });
  }, []);

  // Returns Promise<string | null>  (null = cancelled)
  const prompt = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog({ message, type: 'prompt', inputValue: '', ...options });
    });
  }, []);

  const handleConfirm = () => {
    if (dialog?.type === 'prompt') {
      resolveRef.current?.(dialog.inputValue);
    } else {
      resolveRef.current?.(true);
    }
    setDialog(null);
  };

  const handleCancel = () => {
    resolveRef.current?.(dialog?.type === 'prompt' ? null : false);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />
          <div
            className="relative bg-surface-card border border-fest-border rounded-2xl shadow-2xl p-6 w-full max-w-md"
            style={{ animation: 'toast-in 0.2s ease' }}
          >
            <h3 className="text-lg font-bold text-text-primary mb-2">
              {dialog.title || (dialog.type === 'prompt' ? 'Input Required' : 'Confirm Action')}
            </h3>
            <p className="text-text-secondary text-sm mb-4">{dialog.message}</p>

            {dialog.type === 'prompt' && (
              <input
                className="w-full px-3 py-2 rounded-lg bg-surface border border-fest-border focus:border-primary/50 text-text-primary placeholder:text-text-secondary text-sm outline-none focus:ring-2 focus:ring-primary/20 mb-4"
                placeholder={dialog.inputPlaceholder || ''}
                value={dialog.inputValue}
                onChange={(e) => setDialog((d) => ({ ...d, inputValue: e.target.value }))}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-fest-border text-text-secondary hover:text-text-primary hover:bg-surface transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg text-white text-sm font-bold transition-colors ${
                  dialog.danger !== false
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                {dialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

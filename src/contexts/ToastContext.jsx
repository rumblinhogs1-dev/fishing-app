import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message) => {
    const id = ++toastId;
    const duration = type === 'error' ? 5000 : 3000;

    setToasts((prev) => {
      const next = [...prev, { id, type, message }];
      if (next.length > 3) next.shift();
      return next;
    });

    timersRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, [removeToast]);

  const success = useCallback((msg) => addToast('success', msg), [addToast]);
  const error = useCallback((msg) => addToast('error', msg), [addToast]);
  const info = useCallback((msg) => addToast('info', msg), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, success, error, info, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex min-w-[260px] max-w-[340px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl"
          >
            {t.type === "success" && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle size={16} />
              </span>
            )}
            {t.type === "error" && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle size={16} />
              </span>
            )}
            {t.type === "info" && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Info size={16} />
              </span>
            )}
            <p className="text-sm font-semibold text-slate-800">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requires ToastProvider");
  return ctx;
}

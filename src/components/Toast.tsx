"use client";

import { useEffect, useState } from "react";

let showToastFn: ((msg: string, type?: "success" | "error" | "info") => void) | null = null;

export function toast(msg: string, type: "success" | "error" | "info" = "success") {
  showToastFn?.(msg, type);
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);

  useEffect(() => {
    showToastFn = (msg, type = "success") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    };
    return () => { showToastFn = null; };
  }, []);

  const colors: Record<string, string> = {
    success: "bg-success-500",
    error: "bg-error-500",
    info: "bg-brand-500",
  };

  const icons: Record<string, React.ReactNode> = {
    success: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    error: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
    info: <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  };

  return (
    <div className="fixed top-4 right-4 z-[999999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-[slideIn_0.3s_ease] min-w-[280px]"
          style={{ backgroundColor: colors[t.type] ? undefined : undefined }}
        >
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colors[t.type]} bg-opacity-20`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              {icons[t.type]}
            </svg>
          </div>
          <span className={`${colors[t.type]} bg-clip-text`} style={{ color: "white" }}>{t.msg}</span>
        </div>
      ))}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .fixed.top-4.right-4 > div { background: #1d2939; }
      `}</style>
    </div>
  );
}

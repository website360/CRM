"use client";

import { useRef, useState } from "react";

export default function ImageUpload({ value, onChange, label }: { value: string; onChange: (url: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>}
      <div className="flex items-center gap-3">
        {/* Preview */}
        <div
          onClick={() => inputRef.current?.click()}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-brand-400 transition overflow-hidden"
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover rounded-lg" />
          ) : uploading ? (
            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </div>

        <div className="flex-1">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="text-sm font-medium text-brand-500 hover:text-brand-600 transition disabled:opacity-50">
            {uploading ? "Enviando..." : value ? "Trocar foto" : "Fazer upload"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange("")}
              className="ml-3 text-sm text-gray-400 hover:text-error-500 transition">
              Remover
            </button>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">JPG, PNG. Máx 2MB.</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}

"use client";

import { useTheme } from "./ThemeProvider";

export default function HeaderClient() {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 md:px-6">
      <div className="lg:hidden w-8" />

      {/* Search */}
      <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 shadow-theme-xs w-64">
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Buscar..." className="bg-transparent outline-none w-full text-gray-800 dark:text-white/90 placeholder:text-gray-400" />
      </div>

      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          {dark ? (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Notification */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition">
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">3</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">Admin</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}

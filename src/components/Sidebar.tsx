'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /> },
  { name: 'Leads', href: '/leads', icon: <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
  { name: 'CRM', href: '/crm', icon: <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
  { name: 'Remarketing', href: '/remarketing', icon: <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /> },
  { name: 'Inbox', href: '/inbox', icon: <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /> },
  { name: 'Contatos', href: '/contatos', icon: <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
  { name: 'Canais', href: '/whatsapp', fill: true, icon: <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35m-5.42 7.4a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 012.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 00-3.48-8.41z" /> },
  { name: 'Automações', href: '/automacoes', icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> },
  { name: 'Equipe', href: '/equipe', icon: <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
  { name: 'Configurações', href: '/configuracoes', icon: <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /> },
  { name: 'Ajuda', href: '/ajuda', icon: <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
];

type UserInfo = { name: string; email: string; avatar: string | null };

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen, setSidebarOpen } = useTheme();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.ok ? r.json() : null).then((d) => { if (d?.user) setUser(d.user); }).catch(() => {});
  }, []);

  return (
    <>
      {/* Mobile toggle */}
      <button className="lg:hidden fixed top-4 left-4 z-[9999] p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-theme-xs"
        onClick={() => setSidebarOpen(!sidebarOpen)}>
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={sidebarOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      <aside className={`fixed left-0 top-0 z-[9999] flex h-screen flex-col overflow-y-hidden border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'w-[80px]' : 'w-[290px]'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:translate-x-0`}>

        {/* Header */}
        <div className={`flex items-center gap-3 pt-6 pb-6 px-5 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">CRM LP</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <span className="text-white font-bold text-sm">C</span>
            </div>
          )}
          <button onClick={toggleSidebar} className={`hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition ${sidebarCollapsed ? 'absolute -right-3.5 top-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-theme-xs rounded-full' : ''}`}>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <div className="flex flex-col flex-1 overflow-y-auto px-4">
          {!sidebarCollapsed && <h3 className="mb-3 px-3 text-xs uppercase tracking-wider font-semibold text-gray-400">Menu</h3>}
          <ul className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
                      ${sidebarCollapsed ? 'justify-center' : ''}
                      ${active
                        ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5'
                      }`}
                    title={sidebarCollapsed ? item.name : undefined}>
                    <svg className={`w-6 h-6 shrink-0 ${item.fill
                        ? (active ? 'fill-brand-500 dark:fill-brand-400' : 'fill-gray-500 dark:fill-gray-400')
                        : ''}`}
                      fill={item.fill ? undefined : 'none'}
                      stroke={item.fill ? undefined : 'currentColor'}
                      strokeWidth={item.fill ? undefined : 1.8}
                      strokeLinecap="round" strokeLinejoin="round"
                      viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-4">
            <Link href="/perfil" className="flex items-center gap-3 hover:opacity-80 transition">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500">
                  <span className="text-sm font-bold text-white">{user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">{user?.name || "..."}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 z-[9998] bg-black/30" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}

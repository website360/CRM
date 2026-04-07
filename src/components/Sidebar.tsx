'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: <path fillRule="evenodd" clipRule="evenodd" d="M5.5 3.25C4.26 3.25 3.25 4.26 3.25 5.5V9C3.25 10.24 4.26 11.25 5.5 11.25H9C10.24 11.25 11.25 10.24 11.25 9V5.5C11.25 4.26 10.24 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.09 5.09 4.75 5.5 4.75H9C9.41 4.75 9.75 5.09 9.75 5.5V9C9.75 9.41 9.41 9.75 9 9.75H5.5C5.09 9.75 4.75 9.41 4.75 9V5.5ZM5.5 12.75C4.26 12.75 3.25 13.76 3.25 15V18.5C3.25 19.74 4.26 20.75 5.5 20.75H9C10.24 20.75 11.25 19.74 11.25 18.5V15C11.25 13.76 10.24 12.75 9 12.75H5.5ZM4.75 15C4.75 14.59 5.09 14.25 5.5 14.25H9C9.41 14.25 9.75 14.59 9.75 15V18.5C9.75 18.91 9.41 19.25 9 19.25H5.5C5.09 19.25 4.75 18.91 4.75 18.5V15ZM12.75 5.5C12.75 4.26 13.76 3.25 15 3.25H18.5C19.74 3.25 20.75 4.26 20.75 5.5V9C20.75 10.24 19.74 11.25 18.5 11.25H15C13.76 11.25 12.75 10.24 12.75 9V5.5ZM15 4.75C14.59 4.75 14.25 5.09 14.25 5.5V9C14.25 9.41 14.59 9.75 15 9.75H18.5C18.91 9.75 19.25 9.41 19.25 9V5.5C19.25 5.09 18.91 4.75 18.5 4.75H15ZM15 12.75C13.76 12.75 12.75 13.76 12.75 15V18.5C12.75 19.74 13.76 20.75 15 20.75H18.5C19.74 20.75 20.75 19.74 20.75 18.5V15C20.75 13.76 19.74 12.75 18.5 12.75H15ZM14.25 15C14.25 14.59 14.59 14.25 15 14.25H18.5C18.91 14.25 19.25 14.59 19.25 15V18.5C19.25 18.91 18.91 19.25 18.5 19.25H15C14.59 19.25 14.25 18.91 14.25 18.5V15Z" />,
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: <path fillRule="evenodd" clipRule="evenodd" d="M8.8 5.6C7.59 5.6 6.61 6.59 6.61 7.8C6.61 9.01 7.59 10 8.8 10C10.02 10 11 9.01 11 7.8C11 6.59 10.02 5.6 8.8 5.6ZM5.11 7.8C5.11 5.76 6.76 4.1 8.8 4.1C10.85 4.1 12.5 5.76 12.5 7.8C12.5 9.84 10.85 11.5 8.8 11.5C6.76 11.5 5.11 9.84 5.11 7.8ZM4.86 15.32C4.09 16.09 3.7 17.06 3.52 17.86C3.48 18 3.52 18.12 3.61 18.21C3.7 18.31 3.87 18.4 4.08 18.4H13.42C13.63 18.4 13.8 18.31 13.89 18.21C13.98 18.12 14.02 18 13.98 17.86C13.8 17.06 13.41 16.09 12.64 15.32C11.88 14.57 10.69 13.96 8.75 13.96C6.81 13.96 5.62 14.57 4.86 15.32Z" />,
  },
  {
    name: 'CRM',
    href: '/crm',
    icon: <path fillRule="evenodd" clipRule="evenodd" d="M3.75 5.5C3.75 4.26 4.76 3.25 6 3.25H18C19.24 3.25 20.25 4.26 20.25 5.5V7.5C20.25 8.09 19.97 8.64 19.5 9C19.97 9.36 20.25 9.91 20.25 10.5V12.5C20.25 13.09 19.97 13.64 19.5 14C19.97 14.36 20.25 14.91 20.25 15.5V18.5C20.25 19.74 19.24 20.75 18 20.75H6C4.76 20.75 3.75 19.74 3.75 18.5V5.5ZM5.25 5.5V8.25H18.75V5.5C18.75 5.09 18.41 4.75 18 4.75H6C5.59 4.75 5.25 5.09 5.25 5.5ZM5.25 9.75V13.25H18.75V9.75H5.25ZM5.25 14.75V18.5C5.25 18.91 5.59 19.25 6 19.25H18C18.41 19.25 18.75 18.91 18.75 18.5V14.75H5.25Z" />,
  },
  {
    name: 'Remarketing',
    href: '/remarketing',
    icon: <path fillRule="evenodd" clipRule="evenodd" d="M12 3.25C7.17 3.25 3.25 7.17 3.25 12C3.25 16.83 7.17 20.75 12 20.75C16.83 20.75 20.75 16.83 20.75 12C20.75 7.17 16.83 3.25 12 3.25ZM4.75 12C4.75 7.99 7.99 4.75 12 4.75C14 4.75 15.81 5.56 17.12 6.88L7.5 12L4.81 10.46C4.77 10.97 4.75 11.48 4.75 12ZM12 19.25C8.47 19.25 5.54 16.78 4.88 13.5L8.5 15.5L19.14 9.38C19.21 9.58 19.25 9.79 19.25 10C19.25 15.24 16.83 19.25 12 19.25Z" />,
  },
  {
    name: 'WhatsApp',
    href: '/whatsapp',
    icon: <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.14-1.26-.46-2.4-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51-.17 0-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35m-5.42 7.4h0a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26C.16 5.34 4.44.89 9.89.89c2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 012.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 00-3.48-8.41z" />,
  },
  {
    name: 'Demo Site',
    href: '/demo',
    icon: <><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.46 12C3.73 7.94 7.52 5 12 5c4.48 0 8.27 2.94 9.54 7-1.27 4.06-5.06 7-9.54 7-4.48 0-8.27-2.94-9.54-7z" /></>,
    stroke: true,
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-[9999] p-2 rounded-lg bg-white border border-gray-200 shadow-theme-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 z-[9999] flex h-screen w-[290px] flex-col overflow-y-hidden border-r border-gray-200 bg-white px-5 lg:static lg:translate-x-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 pt-8 pb-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900">CRM LP</span>
          </div>
        </div>

        {/* Nav */}
        <div className="flex flex-col overflow-y-auto no-scrollbar">
          <nav>
            <h3 className="mb-4 text-xs uppercase leading-5 text-gray-400 font-semibold tracking-wider">
              Menu
            </h3>
            <ul className="flex flex-col gap-1 mb-6">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-brand-50 text-brand-500'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <svg
                        className={item.stroke ? (isActive ? 'stroke-brand-500' : 'stroke-gray-500') : (isActive ? 'fill-brand-500' : 'fill-gray-500')}
                        width="24" height="24" viewBox="0 0 24 24"
                        fill={item.stroke ? 'none' : undefined}
                        stroke={item.stroke ? 'currentColor' : undefined}
                        strokeWidth={item.stroke ? 1.8 : undefined}
                      >
                        {item.icon}
                      </svg>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-gray-200 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <span className="text-sm font-semibold text-gray-700">A</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Admin</p>
              <p className="text-xs text-gray-500">admin@crmlp.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[9998] bg-black/30" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}

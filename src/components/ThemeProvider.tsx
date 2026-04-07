"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeContextType = {
  dark: boolean;
  toggle: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  dark: false, toggle: () => {}, sidebarCollapsed: false, toggleSidebar: () => {}, sidebarOpen: false, setSidebarOpen: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") { setDark(true); document.documentElement.classList.add("dark"); }
    const collapsed = localStorage.getItem("sidebarCollapsed");
    if (collapsed === "true") setSidebarCollapsed(true);
  }, []);

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      localStorage.setItem("darkMode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      localStorage.setItem("sidebarCollapsed", String(!c));
      return !c;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle, sidebarCollapsed, toggleSidebar, sidebarOpen, setSidebarOpen }}>
      {children}
    </ThemeContext.Provider>
  );
}

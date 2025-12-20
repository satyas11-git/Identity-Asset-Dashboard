import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DashboardContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  cachedData: Record<string, any>;
  setCachedData: (key: string, data: any) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [cachedData, setCachedDataState] = useState<Record<string, any>>({});

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const setCachedData = (key: string, data: any) => {
    setCachedDataState(prev => ({ ...prev, [key]: data }));
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  };

  return (
    <DashboardContext.Provider value={{ darkMode, toggleDarkMode, cachedData, setCachedData }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}

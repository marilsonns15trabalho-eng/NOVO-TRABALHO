'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Settings {
  studioName: string;
  studioSlogan: string;
  currency: string;
  primaryColor: string;
  language: string;
  notificationsEnabled: boolean;
  autoBackup: boolean;
  logoUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  studioName: 'LIONESS',
  studioSlogan: 'Personal Estúdio',
  currency: 'BRL',
  primaryColor: '#f97316', // orange-500
  language: 'pt-BR',
  notificationsEnabled: true,
  autoBackup: false,
  logoUrl: '',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('lpe_settings');
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings);
        } catch (e) {
          console.error('Failed to parse settings', e);
        }
      }
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('lpe_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

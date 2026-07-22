import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'contaflow:theme';

function applyThemeClass(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }) {
  const { profile, updateUserProfile } = useAuth();
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Once the Firestore profile loads, it's the source of truth (e.g. signing
  // in on a new device should carry the preference over) — but only when it
  // actually differs, so we don't fight a change the user just made locally.
  useEffect(() => {
    if (profile?.theme && profile.theme !== theme) {
      setThemeState(profile.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.theme]);

  useEffect(() => {
    applyThemeClass(theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  const setTheme = (next) => {
    setThemeState(next);
    if (profile) updateUserProfile({ theme: next });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

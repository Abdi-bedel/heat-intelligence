'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'heat-theme';

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const next: ThemeMode = stored === 'light' || stored === 'dark' ? stored : 'dark';
    setTheme(next);
    applyTheme(next);
  }, []);

  function setMode(next: ThemeMode) {
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  }

  return (
    <div className="fixed right-3 top-3 z-50 sm:right-4 sm:top-4">
      <div className="flex items-center gap-1 rounded-full border-hairline border-border bg-bg-card p-1 shadow-[0_8px_20px_rgba(0,0,0,0.25)] backdrop-blur">
        <button
          type="button"
          onClick={() => setMode('dark')}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:px-3 ${
            theme === 'dark' ? 'bg-text-primary text-bg-card' : 'text-text-secondary hover:text-text-primary'
          }`}
          aria-pressed={theme === 'dark'}
        >
          Dark
        </button>
        <button
          type="button"
          onClick={() => setMode('light')}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition sm:px-3 ${
            theme === 'light' ? 'bg-text-primary text-bg-card' : 'text-text-secondary hover:text-text-primary'
          }`}
          aria-pressed={theme === 'light'}
        >
          Light
        </button>
      </div>
    </div>
  );
}

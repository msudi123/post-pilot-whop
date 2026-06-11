'use client';

import { useEffect } from 'react';

type WhopThemeDetail = {
  appearance?: 'light' | 'dark';
};

function applyAppearance(appearance?: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const isDark = appearance === 'dark';
  const resolved = isDark ? 'dark' : 'light';
  root.classList.toggle('dark', isDark);
  root.dataset.whopAppearance = resolved;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
}

export default function WhopThemeBridge() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    applyAppearance(media.matches ? 'dark' : 'light');

    const handleThemeEvent = (event: Event) => {
      const detail = (event as CustomEvent<WhopThemeDetail>).detail;
      applyAppearance(detail?.appearance);
    };

    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (!document.documentElement.dataset.whopAppearance) {
        applyAppearance(event.matches ? 'dark' : 'light');
      }
    };

    document.documentElement.addEventListener('frosted-ui:set-theme', handleThemeEvent as EventListener);
    media.addEventListener('change', handleMediaChange);

    return () => {
      document.documentElement.removeEventListener('frosted-ui:set-theme', handleThemeEvent as EventListener);
      media.removeEventListener('change', handleMediaChange);
    };
  }, []);

  return null;
}

import type { Config } from 'tailwindcss';
import { heatPreset } from '@heat/ui';

const config: Config = {
  presets: [heatPreset as Config],
  content: [
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          secondary: 'var(--bg-secondary)',
          card: 'var(--bg-card)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        coral: {
          DEFAULT: 'var(--coral)',
          soft: 'var(--coral-soft)',
          text: 'var(--coral-text)',
        },
        teal: {
          DEFAULT: 'var(--teal)',
          soft: 'var(--teal-soft)',
          text: 'var(--teal-text)',
        },
        purple: {
          DEFAULT: 'var(--purple)',
          soft: 'var(--purple-soft)',
          text: 'var(--purple-text)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft: 'var(--amber-soft)',
          text: 'var(--amber-text)',
        },
      },
    },
  },
};

export default config;

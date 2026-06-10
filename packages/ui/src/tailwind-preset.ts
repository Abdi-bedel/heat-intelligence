import type { Config } from 'tailwindcss';

// Shared Tailwind preset — both apps extend this so design tokens stay single-source.
// Tokens mirror packages/ui/src/tokens.css and ux-guide/heat-design-spec.md §1.

export const heatPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#faf8f5',
          secondary: '#f3eee7',
          card: '#ffffff',
        },
        text: {
          primary: '#1a1612',
          secondary: '#6b6359',
          tertiary: '#a39a8e',
        },
        border: {
          DEFAULT: '#e7e0d6',
          strong: '#d4cabc',
        },
        coral: {
          DEFAULT: '#d85a30',
          soft: 'rgba(216, 90, 48, 0.08)',
          text: '#993c1d',
        },
        teal: {
          DEFAULT: '#1d9e75',
          soft: 'rgba(29, 158, 117, 0.1)',
          text: '#0f6e56',
        },
        purple: {
          DEFAULT: '#7f77dd',
          soft: 'rgba(127, 119, 221, 0.12)',
          text: '#3c3489',
        },
        amber: {
          DEFAULT: '#ef9f27',
          soft: 'rgba(239, 159, 39, 0.12)',
          text: '#8a5500',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        lg: '16px',
      },
      borderWidth: {
        hairline: '0.5px',
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'pulse-now': 'pulse-now 1.6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.85)' },
        },
        'pulse-now': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.9' },
        },
      },
    },
  },
};

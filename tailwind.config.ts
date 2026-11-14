import type { Config } from 'tailwindcss'

/**
 * Tailwind is wired to the CSS variables in src/styles/tokens.css.
 * `colors` replaces the default palette on purpose: components can only
 * use token colours, so nothing is hard-coded.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: {
        DEFAULT: 'var(--color-bg)',
        2: 'var(--color-bg-2)',
      },
      glass: 'var(--glass-border)',
      better: 'var(--color-better)',
      worse: 'var(--color-worse)',
      surface: {
        DEFAULT: 'var(--color-surface)',
        muted: 'var(--color-surface-muted)',
      },
      border: {
        DEFAULT: 'var(--color-border)',
        strong: 'var(--color-border-strong)',
      },
      text: {
        DEFAULT: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
      },
      primary: {
        DEFAULT: 'var(--color-primary)',
        strong: 'var(--color-primary-strong)',
        soft: 'var(--color-primary-soft)',
      },
      'on-primary': {
        DEFAULT: 'var(--color-on-primary)',
        muted: 'var(--color-on-primary-muted)',
      },
      heading: 'var(--color-heading)',
      selected: 'var(--color-selected)',
      accent: {
        DEFAULT: 'var(--color-accent)',
        hover: 'var(--color-accent-hover)',
        text: 'var(--color-accent-text)',
        soft: 'var(--color-accent-soft)',
      },
      'on-accent': 'var(--color-on-accent)',
      danger: {
        DEFAULT: 'var(--color-danger)',
        soft: 'var(--color-danger-soft)',
      },
      focus: 'var(--color-focus)',
      data: {
        temp: 'var(--data-temp)',
        'temp-soft': 'var(--data-temp-soft)',
        precip: 'var(--data-precip)',
        'precip-soft': 'var(--data-precip-soft)',
        soil: 'var(--data-soil)',
        'soil-soft': 'var(--data-soil-soft)',
        grid: 'var(--data-grid)',
      },
      globe: {
        ocean: 'var(--globe-ocean)',
      },
    },
    fontFamily: {
      sans: 'var(--font-family-sans)',
      display: 'var(--font-family-display)',
    },
    fontSize: {
      sm: ['var(--fs-sm)', { lineHeight: 'var(--lh-snug)' }],
      base: ['var(--fs-base)', { lineHeight: 'var(--lh-normal)' }],
      lg: ['var(--fs-lg)', { lineHeight: 'var(--lh-normal)' }],
      xl: ['var(--fs-xl)', { lineHeight: 'var(--lh-snug)' }],
      '2xl': ['var(--fs-2xl)', { lineHeight: 'var(--lh-snug)' }],
      '3xl': ['var(--fs-3xl)', { lineHeight: 'var(--lh-tight)' }],
      '4xl': ['var(--fs-4xl)', { lineHeight: 'var(--lh-tight)' }],
      '5xl': ['var(--fs-5xl)', { lineHeight: 'var(--lh-tight)' }],
      '6xl': ['var(--fs-6xl)', { lineHeight: '1.02' }],
    },
    borderRadius: {
      none: '0',
      control: 'var(--radius-control)',
      card: 'var(--radius-card)',
      pill: 'var(--radius-pill)',
    },
    boxShadow: {
      none: 'none',
      card: 'var(--shadow-card)',
      raised: 'var(--shadow-raised)',
      glow: 'var(--glow-accent)',
      'glow-soft': 'var(--glow-soft)',
    },
    extend: {
      spacing: {
        gutter: 'var(--space-gutter)',
        section: 'var(--space-section)',
        tap: 'var(--size-tap)',
        'tap-lg': 'var(--size-tap-lg)',
        header: 'var(--size-header)',
        stepper: 'var(--size-stepper)',
      },
      maxWidth: {
        content: 'var(--size-content)',
      },
      zIndex: {
        header: 'var(--z-header)',
        popover: 'var(--z-popover)',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        base: 'var(--motion-base)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        token: 'var(--motion-ease)',
      },
    },
  },
} satisfies Config

/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--${v}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: c('surface'),
          raised: c('surface-raised'),
          muted: c('surface-muted'),
        },
        content: c('content'),
        bright: c('bright'),
        muted: c('muted'),
        faint: c('faint'),
        line: {
          DEFAULT: c('line'),
          strong: c('line-strong'),
        },
        accent: {
          DEFAULT: c('accent'),
          soft: c('accent-soft'),
          strong: c('accent-strong'),
        },
        'on-accent': c('on-accent'),
        good: c('good'),
        bad: c('bad'),
        info: c('info'),
        cat: {
          solid: c('cat-solid'),
          creational: c('cat-creational'),
          structural: c('cat-structural'),
          behavioral: c('cat-behavioral'),
          architecture: c('cat-architecture'),
          tradeoff: c('cat-tradeoff'),
          microservices: c('cat-microservices'),
        },
      },
      fontFamily: {
        sans: ['Onest', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Source Code Pro', 'ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-sm)',
        'card-lg': 'var(--shadow-md)',
      },
      borderColor: {
        DEFAULT: c('line'),
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.2,.75,.2,1)',
      },
    },
  },
  plugins: [],
};

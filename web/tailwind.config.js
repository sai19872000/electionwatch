/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['attribute', 'data-theme'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        bg:            'var(--bg)',
        fg:            'var(--fg)',
        muted:         'var(--muted)',
        accent:        'var(--accent)',
        'accent-deep': 'var(--accent-deep)',
        border:        'var(--border)',
        surface:       'var(--surface)',
        surface2:      'var(--surface-2)',
        danger:        'var(--danger)',
        warn:          'var(--warn)',
        ok:            'var(--ok)',
        // Alliance — election-domain semantics (ECI), not brand tokens
        'alliance-nda':   'var(--alliance-nda)',
        'alliance-india': 'var(--alliance-india)',
        'alliance-oth':   'var(--alliance-oth)',
      },
    },
  },
  plugins: [],
};

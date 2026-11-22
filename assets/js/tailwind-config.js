tailwind.config = {
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-ink)',
        'ink-subtitle': 'var(--color-ink-subtitle)',
        'ink-secondary': 'var(--color-ink-secondary)',
        'ink-muted': 'var(--color-ink-muted)',
        hairline: 'var(--color-hairline)',
        'badge-bg': 'var(--color-badge-bg)',
        'badge-text': 'var(--color-badge-text)',
        'footer-bg': 'var(--color-footer-bg)',
        'footer-ink': 'var(--color-footer-ink)',
        'footer-secondary': 'var(--color-footer-secondary)',
        'footer-muted': 'var(--color-footer-muted)'
      },
      fontFamily: {
        sans: ['"Geist"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Geist"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif']
      }
    }
  }
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        sidebar: 'var(--bg-sidebar)',
        surface: 'var(--bg-surface)',
        hover: 'var(--bg-hover)',
        border: 'var(--border-color)',
        content: 'var(--text-primary)',
        contentMuted: 'var(--text-muted)',
        accent: {
          main: 'var(--accent-main)',
          fg: 'var(--accent-fg)',
        }
      },
      boxShadow: {
        'minimal': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'minimal-dark': '0 2px 8px rgba(0, 0, 0, 0.3)'
      }
    },
  },
  plugins: [],
}


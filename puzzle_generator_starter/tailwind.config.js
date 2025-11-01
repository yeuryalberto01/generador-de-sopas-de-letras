/** Opcional: activa Tailwind si lo instalas */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
        card: 'rgb(var(--color-bg-card) / <alpha-value>)',
        'panel-expanded': 'rgb(var(--color-bg-panel-expanded) / <alpha-value>)',
        input: 'rgb(var(--color-bg-input) / <alpha-value>)',
        
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-accent': 'rgb(var(--color-text-accent) / <alpha-value>)',

        'border-primary': 'rgb(var(--color-border-primary) / <alpha-value>)',
        'border-secondary': 'rgb(var(--color-border-secondary) / <alpha-value>)',
        'border-focus': 'rgb(var(--color-border-focus) / <alpha-value>)',

        'accent-primary': 'rgb(var(--color-accent-primary) / <alpha-value>)',
        'accent-primary-hover': 'rgb(var(--color-accent-primary-hover) / <alpha-value>)',
        'accent-text': 'rgb(var(--color-accent-text) / <alpha-value>)',
      }
    }
  },
  plugins: [],
}

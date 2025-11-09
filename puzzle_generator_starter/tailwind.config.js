/** Opcional: activa Tailwind si lo instalas */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Fondos
        surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
        card: 'rgb(var(--color-bg-card) / <alpha-value>)',
        'panel-expanded': 'rgb(var(--color-bg-panel-expanded) / <alpha-value>)',
        input: 'rgb(var(--color-bg-input) / <alpha-value>)',
        'disabled-bg': 'rgb(var(--color-bg-disabled) / <alpha-value>)',

        // Texto
        primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
        accent: 'rgb(var(--color-text-accent) / <alpha-value>)',
        disabled: 'rgb(var(--color-text-disabled) / <alpha-value>)',
        warning: 'rgb(var(--color-text-warning) / <alpha-value>)',

        // Bordes
        'border-primary': 'rgb(var(--color-border-primary) / <alpha-value>)',
        'border-secondary': 'rgb(var(--color-border-secondary) / <alpha-value>)',
        'border-focus': 'rgb(var(--color-border-focus) / <alpha-value>)',

        // Acentos para elementos interactivos (botones, etc.)
        'accent-primary': 'rgb(var(--color-accent-primary) / <alpha-value>)',
        'accent-primary-hover': 'rgb(var(--color-accent-primary-hover) / <alpha-value>)',
        'accent-text': 'rgb(var(--color-accent-text) / <alpha-value>)',
        'accent-success': 'rgb(var(--color-accent-success) / <alpha-value>)',
        'accent-success-hover': 'rgb(var(--color-accent-success-hover) / <alpha-value>)',
        'accent-danger': 'rgb(var(--color-accent-danger) / <alpha-value>)',
        'accent-danger-hover': 'rgb(var(--color-accent-danger-hover) / <alpha-value>)',
      }
    }
  },
  plugins: [],
}

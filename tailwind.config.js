/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base dark theme colors
        'bg-primary': '#0B0C0F',
        'bg-secondary': '#14161B',
        'bg-tertiary': '#1C1F26',
        'bg-quaternary': '#252932',
        'border-subtle': '#2A2E38',
        'border-medium': '#3A4050',
        'border-strong': '#4A5268',
        // Text colors
        'text-primary': '#E8EAEF',
        'text-secondary': '#9BA3B4',
        'text-tertiary': '#5C6370',
        'text-inverse': '#0B0C0F',
        // Phase accent colors
        'accent-dashboard': '#6366F1',
        'accent-input': '#06D6A0',
        'accent-structure': '#F59E0B',
        'accent-execution': '#EF4444',
        'accent-validation': '#8B5CF6',
        'accent-output': '#0EA5E9',
        // Semantic colors
        'success': '#22C55E',
        'warning': '#F59E0B',
        'error': '#EF4444',
        'info': '#3B82F6',
        // shadcn compatibility (dark theme only)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      maxWidth: {
        'content': '1440px',
      },
      spacing: {
        'sidebar': '280px',
        'sidebar-collapsed': '72px',
        'topbar': '56px',
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'glow-input': '0 8px 24px rgba(6, 214, 160, 0.1)',
        'glow-dashboard': '0 8px 24px rgba(99, 102, 241, 0.1)',
        'glow-output': '0 8px 24px rgba(14, 165, 233, 0.1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        "pulse-border": {
          "0%, 100%": { borderColor: "rgba(42, 46, 56, 1)" },
          "50%": { borderColor: "rgba(245, 158, 11, 0.3)" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "pulse-border": "pulse-border 3s ease-in-out infinite",
        "pulse-dot": "pulse-dot 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

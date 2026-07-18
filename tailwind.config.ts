/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Theme tokens — lets `bg-primary`, `hover:bg-primary/90`,
          // `focus:border-primary`, `text-primary` etc. resolve to the
          // CSS custom properties defined in index.css (previously only
          // wired up as hand-written .bg-background/.bg-card/etc classes,
          // which never covered "primary" — leaving buttons using the
          // Tailwind utility silently unstyled/invisible).
          primary: 'hsl(var(--primary) / <alpha-value>)',
          'primary-foreground': 'hsl(var(--primary-foreground) / <alpha-value>)',
          // Wireless brand — crimson red
          brand: {
            50:  '#FFF0F0',
            100: '#FFDADA',
            200: '#FFAAAA',
            300: '#FF7070',
            400: '#F43535',
            500: '#DC1F1F',
            600: '#B81616',
            700: '#8B1010',
            800: '#5C0808',
            900: '#2E0404',
            950: '#160302',
          },
          // Warm accent — burnt orange
          accent: {
            50:  '#FFF4EE',
            100: '#FFE4CC',
            200: '#FFC899',
            300: '#FFA166',
            400: '#E06030',
            500: '#C84015',
            600: '#A8340F',
            700: '#7D260A',
            800: '#531906',
            900: '#2A0C03',
          },
        },
      },
    },
    plugins: [],
  }

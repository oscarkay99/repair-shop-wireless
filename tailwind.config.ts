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
          // Wireless brand — red sampled directly from the official logo mark
          brand: {
            50:  '#FEF0F1',
            100: '#FCD9DC',
            200: '#F8A6AE',
            300: '#F46C79',
            400: '#EF2F42',
            500: '#EC0118',
            600: '#BD0113',
            700: '#89010E',
            800: '#5A0009',
            900: '#2F0005',
            950: '#180002',
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

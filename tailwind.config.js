const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}", // kalau punya komponen custom
    "./app/**/*.{js,ts,jsx,tsx}",        // kalau pakai folder app
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans], // contoh kalau mau pakai Inter
      },
      backgroundImage: {
        'unlock': "url('/bg-unlock.webp')", // shortcut bg-unlock
      },
      colors: {
        primary: '#10b981',  // hijau emerald
        dark: '#0f172a',     // slate 900
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0, 0, 0, 0.4)', // buat efek lembut
      },
      blur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

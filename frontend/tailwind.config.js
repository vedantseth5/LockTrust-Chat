/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e6f9fc',
          100: '#b3eef6',
          200: '#80e3f0',
          300: '#4dd8ea',
          400: '#26cfe6',
          500: '#00B8D4',
          600: '#0099CC',
          700: '#007BA8',
        },
        // Sidebar: very dark navy, almost black
        sidebar: '#0f1923',
        'sidebar-hover': '#1a2738',
        'sidebar-active': '#00B8D4',
        'sidebar-border': '#1e2d3d',
        'sidebar-text': '#c9d4df',
        'sidebar-muted': '#6b7e94',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cmu-red': '#C41230',
        'scotty-bg': '#FAFAFA',
        'scotty-card': '#FFFFFF',
        'scotty-border': '#E5E7EB',
        'scotty-text': '#1F2937',
        'scotty-muted': '#6B7280',
        'brain-dump': '#F3F4F6',
        'kinda-urgent': '#FEF3C7',
        'in-progress': '#DBEAFE',
        'done': '#D1FAE5',
      },
    },
  },
  plugins: [],
};

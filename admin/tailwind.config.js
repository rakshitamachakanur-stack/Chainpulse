module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest:  { DEFAULT:'#2C5F5D', light:'#3D7A77', dark:'#1E4240' },
        copper:  { DEFAULT:'#C68642', dark:'#A06E30',  light:'#D4944E' },
        cream:   { DEFAULT:'#F8F4EC', muted:'#D4CFC4', dim:'rgba(248,244,236,0.55)' },
        pine:    '#5E8B7E',
        sage:    '#7AAE8E',
        brick:   '#B85C38',
        slate:   { DEFAULT:'#2E3239', light:'#3D4350' },
        surface: '#182420',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      backgroundImage: {
        'dot-grid': "radial-gradient(rgba(94,139,126,0.1) 1px, transparent 1px)",
      },
      backgroundSize: {
        'dot-grid': '28px 28px',
      },
    },
  },
  plugins: [],
};

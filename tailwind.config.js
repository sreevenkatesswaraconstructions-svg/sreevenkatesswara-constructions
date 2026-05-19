module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: '#004d40',
          700: '#014033'
        },
        gold: '#cfa84b',
        ivory: '#fffaf0',
        beige: '#efe6dd',
        wood: '#8b5e3c'
      },
      fontFamily: {
        serif: ['Merriweather', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}

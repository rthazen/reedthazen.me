module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}'
        // For the best performance and to avoid false positives,
        // be as specific as possible with your content configuration.
    ],
    theme: {
        extend: {
            colors: {
                pink: '#FB2394', // Define the custom primary color
                darkSand: '#967117',
                yellow: '#FDD54E',
                whiteSand: '#f4f1c9',
                blue: '#0070f3'
            }
        }
    },
    plugins: []
};

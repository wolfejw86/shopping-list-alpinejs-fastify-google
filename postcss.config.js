const cssnano = require('cssnano');
const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        process.env.NODE_ENV === 'development'
            ? ''
            : cssnano({
                  preset: 'default',
              }),

        process.env.NODE_ENV === 'development'
            ? ''
            : purgecss({
                  content: ['./views/**/*.html'],
              }),
    ].filter(Boolean),
};

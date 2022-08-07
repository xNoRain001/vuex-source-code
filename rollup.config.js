import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: './src/index.js',

  output: {
    file: './dist/Vuex.js',
    format: 'es'
  },
  
  plugins: [
    babel({
      exclude: 'node_modules/**'
    }),
    resolve({})
  ],

  onwarn (warning) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      return
    }
  }
}
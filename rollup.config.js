import { terser } from 'rollup-plugin-terser';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';


const libName = 'CN_TRACKER';

const configurePlugins = ({ module }) => {
  return [
    resolve({
      jsnext: true,
      main: true,
      browser: true,
    }),
    commonjs(),
    babel({
      presets: [['@babel/preset-env', {
        targets: {
          browsers: ['ie 11'],
        },
      }]],
    }),
    terser({
      module,
      mangle: true,
      compress: true,
    })
  ]
}


const configs = [
  // 自执行的 JS，仅提供给 CDN 场景
  {
    input: 'dist/modules/index.js',
    output: {
      format: 'iife',
      file: './build/index.js',
      name: libName,
    },
    plugins: configurePlugins({ module: false }),
  },
  {
    input: 'dist/modules/index.js',
    output: {
      format: 'esm',
      file: './dist/index.module.js',
    },
    plugins: configurePlugins({ module: true }),
  },
  {
    input: 'dist/modules/index.js',
    output: {
      format: 'umd',
      file: `./dist/index.umd.js`,
      name: libName,
    },
    plugins: configurePlugins({ module: false }),
  }
];

export default configs;
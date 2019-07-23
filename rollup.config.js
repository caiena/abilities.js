import localResolve from 'rollup-plugin-local-resolve'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import glob from 'rollup-plugin-glob-import'
import yaml from 'rollup-plugin-yaml'
import pkg from './package.json'

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'model',
      // file: 'dist/model.umd.js',
      file: pkg.browser,
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      yaml(),
      glob({
        format: 'default',  // required for yaml plugin to work!
        rename(name, id) {
          return `${path.relative(__dirname, id)}/${name}`.replace(/[^\w]/g, '_')
        }
      }),
      localResolve(),
      resolve(), // so Rollup can find dependencies (e.g. `lodash`)
      commonjs(), // so Rollup can convert dependencies (e.g. `lodash`) to an ES module
      babel({
        exclude: ['node_modules/**']
      }),
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.js',
    external: ['@caiena/lodash-ext', '@caiena/i18n', 'moment'],
    output: [
      { file: pkg.main,   format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es',  sourcemap: true }
      // { file: 'dist/model.cjs.js', format: 'cjs', sourcemap: true },
      // { file: 'dist/model.esm.js', format: 'es',  sourcemap: true }
    ],
    plugins: [
      yaml(),
      glob({
        format: 'default',  // required for yaml plugin to work!
        rename(name, id) {
          return `${path.relative(__dirname, id)}/${name}`.replace(/[^\w]/g, '_')
        }
      }),
      localResolve(), // allowing import of index.js files from directory name
      babel({
        exclude: ['node_modules/**']
      }),
    ]
  }
];

/// <reference types="vitest" />

import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts({ include: ["lib"] })
  ],

  resolve: {
    alias: [
      { find: '@',  replacement: resolve(__dirname) }
    ]
  },

  build: {
    copyPublicDir: false,

    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      formats: ["es"],
    },
  },

  test: {
    environment: "node",
    include: [
      "test/**/*.{test,spec}.[jt]s?(x)"
    ]
  }
})

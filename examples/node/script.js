#!/usr/bin/env node

const path = require('path');
const distDir = path.join(__dirname, '..', '..', 'dist')

const _ = require(path.join(distDir, 'lodash-ext.cjs.js'))

console.info('lodash-ext keys:', Object.keys(_).sort())

#!/usr/bin/env node

const path = require('path');
const distDir = path.join(__dirname, '..', '..', 'dist')

const abilities = require(path.join(distDir, 'abilities.cjs.js'))

console.info('abilities keys:', Object.keys(abilities).sort())

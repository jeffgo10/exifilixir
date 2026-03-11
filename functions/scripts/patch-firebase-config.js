/**
 * Patches firebase-functions v1 config so config() returns {} instead of throwing.
 * The emulator still calls config(); in v7 it was removed and throws, which kills the process.
 * Run after npm install (postinstall).
 */
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../node_modules/firebase-functions/lib/v1/config.js');
if (!fs.existsSync(configPath)) {
  console.warn('patch-firebase-config: firebase-functions v1 config not found, skipping');
  process.exit(0);
}

let code = fs.readFileSync(configPath, 'utf8');
const throwLine = 'throw new Error("functions.config() has been removed in firebase-functions v7.';
if (!code.includes(throwLine)) {
  console.warn('patch-firebase-config: config.js already patched or version changed, skipping');
  process.exit(0);
}

code = code.replace(
  /throw new Error\("functions\.config\(\) has been removed[^"]+"[^)]*\);/,
  'return {};'
);
fs.writeFileSync(configPath, code);
console.log('patch-firebase-config: patched firebase-functions v1 config');

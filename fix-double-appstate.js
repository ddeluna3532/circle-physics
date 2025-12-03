import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appFile = path.join(__dirname, 'src', 'App.tsx');
console.log('Reading App.tsx from:', appFile);

let content = fs.readFileSync(appFile, 'utf8');

// Fix the double appState. prefix issue (appState.appState. -> appState.)
const beforeCount = (content.match(/appState\.appState\./g) || []).length;
content = content.replace(/appState\.appState\./g, 'appState.');

const fixedCount = (content.match(/appState\.appState\./g) || []).length;

// Write back
fs.writeFileSync(appFile, content, 'utf8');

console.log('\n' + '='.repeat(60));
console.log(`✅ Fixed double appState. prefixes`);
console.log(`   Found: ${beforeCount} occurrences`);
console.log(`   Remaining: ${fixedCount} (should be 0)`);
console.log(`   File updated: ${appFile}`);
console.log('='.repeat(60));

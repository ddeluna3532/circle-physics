import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appFile = path.join(__dirname, 'src', 'App.tsx');
console.log('Reading App.tsx from:', appFile);

let content = fs.readFileSync(appFile, 'utf8');

// Fix incorrect system.appState. (should be system.)
let count1 = (content.match(/system\.appState\./g) || []).length;
content = content.replace(/system\.appState\./g, 'system.');

// Fix setPhysicsPaused callback syntax (prev => !prev should work, but let's check the actual issue)
// The error shows it's expecting a boolean, not a function
// This suggests setPhysicsPaused in the hook might be incorrectly typed

console.log('\n' + '='.repeat(60));
console.log(`✅ Fixed incorrect prefixes`);
console.log(`   system.appState. → system.: ${count1} occurrences`);
console.log(`   File updated: ${appFile}`);
console.log('='.repeat(60));

fs.writeFileSync(appFile, content, 'utf8');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appFile = path.join(__dirname, 'src', 'App.tsx');
console.log('Reading App.tsx from:', appFile);

let content = fs.readFileSync(appFile, 'utf8');

console.log('\n' + '='.repeat(60));
console.log('Applying critical fixes...\n');

// Fix 1: setSelectedIds updater functions → direct calculation
// Pattern 1: Shift+click to add to selection (line ~1514)
const fix1Before = `appState.setSelectedIds(prev => {
            const next = new Set(prev);
            next.add(hit.id);
            appState.paintSelectedThisStroke.current.add(hit.id);
            return next;
          });`;

const fix1After = `const next = new Set(appState.selectedIds);
          next.add(hit.id);
          appState.setSelectedIds(next);
          appState.paintSelectedThisStroke.current.add(hit.id);`;

if (content.includes(fix1Before)) {
  content = content.replace(fix1Before, fix1After);
  console.log('✓ Fixed setSelectedIds updater (paint selection - shift click)');
}

// Pattern 2: Marquee selection with shift (line ~1669)
const fix2Before = `appState.setSelectedIds(prev => {
          const next = new Set(prev);
          for (const c of circlesInRect) {
            next.add(c.id);
          }
          return next;
        });`;

const fix2After = `const next = new Set(appState.selectedIds);
        for (const c of circlesInRect) {
          next.add(c.id);
        }
        appState.setSelectedIds(next);`;

if (content.includes(fix2Before)) {
  content = content.replace(fix2Before, fix2After);
  console.log('✓ Fixed setSelectedIds updater (marquee selection - shift)');
}

// Pattern 3: Paint selection mode (line ~1780)
const fix3Before = `appState.setSelectedIds(prev => {
          const next = new Set(prev);
          next.add(hit.id);
          return next;
        });`;

const fix3After = `const next = new Set(appState.selectedIds);
        next.add(hit.id);
        appState.setSelectedIds(next);`;

if (content.includes(fix3Before)) {
  content = content.replace(fix3Before, fix3After);
  console.log('✓ Fixed setSelectedIds updater (paint selection)');
}

// Fix 2: Invalid object literals in saveProject call (line ~2122+)
// Remove invalid property names starting with appState.
const saveProjectRegex = /{[\s\S]*?gravityEnabled:[\s\S]*?damping:[\s\S]*?appState\.collisionIterations[\s\S]*?appState\.restitution[\s\S]*?}/;
const saveProjectMatch = content.match(saveProjectRegex);

if (saveProjectMatch) {
  const badObject = saveProjectMatch[0];
  const fixedObject = badObject
    .replace(/appState\.collisionIterations,/g, 'collisionIterations: appState.collisionIterations,')
    .replace(/appState\.restitution,/g, 'restitution: appState.restitution,');
  
  content = content.replace(badObject, fixedObject);
  console.log('✓ Fixed saveProject physics object');
}

// Fix settings object too
const settingsRegex = /{[\s\S]*?appState\.brushSize[\s\S]*?stickyEnabled:[\s\S]*?appState\.stickyStrength[\s\S]*?}/;
const settingsMatch = content.match(settingsRegex);

if (settingsMatch) {
  const badSettings = settingsMatch[0];
  const fixedSettings = badSettings
    .replace(/appState\.brushSize,/g, 'brushSize: appState.brushSize,')
    .replace(/appState\.stickyStrength,/g, 'stickyStrength: appState.stickyStrength,');
  
  content = content.replace(badSettings, fixedSettings);
  console.log('✓ Fixed saveProject settings object');
}

// Fix 3: loadProject references to data.physics.appState and data.settings.appState
content = content.replace(/data\.physics\.appState\.collisionIterations/g, 'data.physics.collisionIterations');
content = content.replace(/data\.physics\.appState\.restitution/g, 'data.physics.restitution');
content = content.replace(/data\.settings\.appState\.brushSize/g, 'data.settings.brushSize');
content = content.replace(/data\.settings\.appState\.stickyStrength/g, 'data.settings.stickyStrength');

console.log('✓ Fixed loadProject property access');

// Write back
fs.writeFileSync(appFile, content, 'utf8');

console.log('\n' + '='.repeat(60));
console.log(`✅ All critical fixes applied!`);
console.log(`   File updated: ${appFile}`);
console.log('='.repeat(60));

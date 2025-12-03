import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appFile = path.join(__dirname, 'src', 'App.tsx');
console.log('Fixing remaining syntax errors in App.tsx...\n');

let content = fs.readFileSync(appFile, 'utf8');

// Fix 1: applyStickyForce dependency array (line ~1093)
content = content.replace(
  /\], \[circles, appState\.stickyMode, stickyStrength: appState\.stickyStrength, isCircleAffected\]\);/g,
  '], [circles, appState.stickyMode, appState.stickyStrength, isCircleAffected]);'
);

// Fix 2: autoSpawn dependency array  
content = content.replace(
  /\], \[addCircle, brushSize: appState\.brushSize, getColor, getActiveLayer\]\);/g,
  '], [addCircle, appState.brushSize, getColor, getActiveLayer]);'
);

// Fix 3: useEffect collision sync dependency array
content = content.replace(
  /\], \[system, collisionIterations: appState\.collisionIterations, appState\.restitution\]\);/g,
  '], [system, appState.collisionIterations, appState.restitution]);'
);

// Fix 4: addCircle calls with invalid syntax `brushSize: appState.brushSize`
content = content.replace(
  /addCircle\(x, y, brushSize: appState\.brushSize, getColor\(\), activeLayer\.id\)/g,
  'addCircle(x, y, appState.brushSize, getColor(), activeLayer.id)'
);

// Fix 5: setSelectedIds updater function in handlePointerMove
content = content.replace(
  /appState\.setSelectedIds\(prev => \{\s*const next = new Set\(prev\);\s*next\.add\(hit\.id\);\s*return next;\s*\}\);/g,
  `const next = new Set(appState.selectedIds);
        next.add(hit.id);
        appState.setSelectedIds(next);`
);

// Fix 6: setSelectedIds updater function in handlePointerUp (marquee selection with shift)
content = content.replace(
  /appState\.setSelectedIds\(prev => \{\s*const next = new Set\(prev\);\s*for \(const c of circlesInRect\) \{\s*next\.add\(c\.id\);\s*\}\s*return next;\s*\}\);/g,
  `const next = new Set(appState.selectedIds);
        for (const c of circlesInRect) {
          next.add(c.id);
        }
        appState.setSelectedIds(next);`
);

fs.writeFileSync(appFile, content, 'utf8');

console.log('✅ Fixed all remaining syntax errors!');
console.log('   - Fixed applyStickyForce dependency array');
console.log('   - Fixed autoSpawn dependency array');
console.log('   - Fixed useEffect collision sync dependency array');
console.log('   - Fixed addCircle function calls');
console.log('   - Fixed setSelectedIds updater functions');

/**
 * QUICK FIX SCRIPT - Remove duplicate function definitions
 * This removes local function definitions that conflict with Phase 4-5 hooks
 */

const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

console.log('Fixing duplicate function definitions...\n');

// Remove the entire block from isCircleAffected through unlockAll
const startMarker = '  // Apply magnet force to circles';
const endMarker = '  // Update undo/redo availability';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx);
  
  content = before + `  // NOTE: Helper functions like isCircle Affected, isCircleModifiable, etc. are now provided by Phase 4-5 hooks
  // Selection operations are also provided by hooks
  
  // ${endMarker}`;
  content += after;
  
  console.log('? Removed duplicate helper function definitions');
}

// Fix the keyboard shortcuts dependency array
content = content.replace(
  'deleteSelection, clearSelection, selectMode, performUndo, performRedo, saveUndoState, isRecording, isPlayingAnimation, startRecording, stopRecording, stopAnimation',
  'deleteSelectionHook, clearSelectionHook, selectMode, performUndo, performRedo, saveUndoState, isRecording, isPlayingAnimation, startRecordingHook, stopRecordingHook, stopAnimationHook'
);
console.log('? Fixed keyboard shortcuts dependency array');

// Update references to unlockAll and recolorSelection/deleteSelection/invertSelection/lockInverse in the JSX
content = content.replace(/onClick={unlockAll}/g, 'onClick={unlockAllHook}');
content = content.replace(/onClick={recolorSelection}/g, 'onClick={recolorSelectionHook}');
content = content.replace(/onClick={deleteSelection}/g, 'onClick={deleteSelectionHook}');
content = content.replace(/onClick={invertSelection}/g, 'onClick={invertSelectionHook}');
content = content.replace(/onClick={lockInverse}/g, 'onClick={lockInverseHook}');
console.log('? Fixed JSX function references');

// Write the file
fs.writeFileSync(appPath, content, 'utf8');
console.log('\n? All fixes applied! Run `npm run build` to test.\n');

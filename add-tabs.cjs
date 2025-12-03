/**
 * Tab Implementation Script
 * 
 * This script adds tab navigation to the Circle Physics app by:
 * 1. Adding tab state variables
 * 2. Wrapping left panel sections in tabs
 * 3. Wrapping right panel sections in tabs
 * 
 * Run with: node add-tabs.js
 */

const fs = require('fs');
const path = require('path');

const APP_FILE = path.join(__dirname, 'src', 'App.tsx');

console.log('🎯 Starting tab implementation...\n');

// Read the file
let content = fs.readFileSync(APP_FILE, 'utf8');

// Step 1: Add tab state after useLayers()
console.log('Step 1: Adding tab state variables...');
const tabStateCode = `
  // Tab state
  const [leftTab, setLeftTab] = useState<'project' | 'colors' | 'tools' | 'physics'>('project');
  const [rightTab, setRightTab] = useState<'layers' | 'effects'>('layers');
`;

// Find the position after useLayers() hook
const layersHookEnd = content.indexOf('} = useLayers();');
if (layersHookEnd === -1) {
  console.error('❌ Could not find useLayers() hook');
  process.exit(1);
}

// Insert tab state after the closing brace
const insertPos = content.indexOf('\n', layersHookEnd) + 1;
content = content.slice(0, insertPos) + tabStateCode + content.slice(insertPos);
console.log('✅ Tab state added\n');

// Step 2: Add left panel tab navigation
console.log('Step 2: Adding left panel tab navigation...');
const leftPanelStart = content.indexOf('<aside className="panel left-panel">');
if (leftPanelStart === -1) {
  console.error('❌ Could not find left panel');
  process.exit(1);
}

const leftPanelH2 = content.indexOf('<h2>Canvas</h2>', leftPanelStart);
const leftTabNav = `
        {/* Tab Navigation */}
        <div className="tab-nav">
          <button 
            className={\`tab-button \${leftTab === 'project' ? 'active' : ''}\`}
            onClick={() => setLeftTab('project')}
          >
            Project
          </button>
          <button 
            className={\`tab-button \${leftTab === 'colors' ? 'active' : ''}\`}
            onClick={() => setLeftTab('colors')}
          >
            Colors
          </button>
          <button 
            className={\`tab-button \${leftTab === 'tools' ? 'active' : ''}\`}
            onClick={() => setLeftTab('tools')}
          >
            Tools
          </button>
          <button 
            className={\`tab-button \${leftTab === 'physics' ? 'active' : ''}\`}
            onClick={() => setLeftTab('physics')}
          >
            Physics
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* PROJECT TAB */}
          <div className={\`tab-pane \${leftTab === 'project' ? 'active' : ''}\`}>
`;

content = content.slice(0, leftPanelH2) + leftTabNav + '            ' + content.slice(leftPanelH2);
console.log('✅ Left panel tab navigation added\n');

// Step 3: Add tab dividers in left panel
console.log('Step 3: Adding left panel tab dividers...');

// After Project section (before Draw)
let drawH2Pos = content.indexOf('<h2>Draw</h2>');
const projectTabEnd = `
          </div>

          {/* COLORS TAB */}
          <div className={\`tab-pane \${leftTab === 'colors' ? 'active' : ''}\`}>
            <h2>Draw</h2>
`;
// Replace <h2>Draw</h2> with the tab divider
content = content.slice(0, drawH2Pos) + projectTabEnd.slice(0, -21) + content.slice(drawH2Pos);

// After Colors section (before Tools)
let toolsH2Pos = content.indexOf('<h2>Tools</h2>');
const colorsTabEnd = `
          </div>

          {/* TOOLS TAB */}
          <div className={\`tab-pane \${leftTab === 'tools' ? 'active' : ''}\`}>
`;
content = content.slice(0, toolsH2Pos) + colorsTabEnd + '            ' + content.slice(toolsH2Pos);

// After Tools section (before Magnet)
let magnetH2Pos = content.indexOf('<h2>Magnet</h2>');
const toolsTabEnd = `
          </div>

          {/* PHYSICS TAB */}
          <div className={\`tab-pane \${leftTab === 'physics' ? 'active' : ''}\`}> 
`;
content = content.slice(0, magnetH2Pos) + toolsTabEnd + '            ' + content.slice(magnetH2Pos);

console.log('✅ Left panel tab dividers added\n');

// Step 4: Close left panel tabs
console.log('Step 4: Closing left panel tab structure...');
const leftPanelEnd = content.indexOf('</aside>', content.indexOf('<aside className="panel left-panel">'));
const leftPanelClose = `
        </div>
      </div>
`;
content = content.slice(0, leftPanelEnd) + leftPanelClose + '    ' + content.slice(leftPanelEnd);
console.log('✅ Left panel tabs closed\n');

// Step 5: Add right panel tab navigation
console.log('Step 5: Adding right panel tab navigation...');
const rightPanelStart = content.indexOf('<aside className="panel right-panel">');
const flowFieldH2 = content.indexOf('<h2>Flow Field</h2>', rightPanelStart);
const rightTabNav = `
        {/* Tab Navigation */}
        <div className="tab-nav">
          <button 
            className={\`tab-button \${rightTab === 'effects' ? 'active' : ''}\`}
            onClick={() => setRightTab('effects')}
          >
            Effects
          </button>
          <button 
            className={\`tab-button \${rightTab === 'layers' ? 'active' : ''}\`}
            onClick={() => setRightTab('layers')}
          >
            Layers
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* EFFECTS TAB */}
          <div className={\`tab-pane \${rightTab === 'effects' ? 'active' : ''}\`}>
`;

content = content.slice(0, flowFieldH2) + rightTabNav + '            ' + content.slice(flowFieldH2);
console.log('✅ Right panel tab navigation added\n');

// Step 6: Add tab divider in right panel
console.log('Step 6: Adding right panel tab divider...');
const layersH2Pos = content.indexOf('<h2>Layers</h2>', rightPanelStart);
const effectsTabEnd = `
          </div>

          {/* LAYERS TAB */}
          <div className={\`tab-pane \${rightTab === 'layers' ? 'active' : ''}\`}>
`;
content = content.slice(0, layersH2Pos) + effectsTabEnd + '            ' + content.slice(layersH2Pos);
console.log('✅ Right panel tab divider added\n');

// Step 7: Close right panel tabs
console.log('Step 7: Closing right panel tab structure...');
const rightPanelEnd = content.indexOf('</aside>', content.indexOf('<aside className="panel right-panel">'));
const rightPanelClose = `
        </div>
      </div>
`;
content = content.slice(0, rightPanelEnd) + rightPanelClose + '    ' + content.slice(rightPanelEnd);
console.log('✅ Right panel tabs closed\n');

// Backup original file
const backupFile = APP_FILE + '.backup';
fs.writeFileSync(backupFile, fs.readFileSync(APP_FILE));
console.log(`📦 Backup created: ${backupFile}\n`);

// Write modified content
fs.writeFileSync(APP_FILE, content);
console.log('✅ App.tsx updated successfully!\n');

console.log('🎉 Tab implementation complete!');
console.log('\nNext steps:');
console.log('1. Run: npm run build');
console.log('2. If successful, run: npm run dev');
console.log('3. Test tabs in browser');
console.log('\nIf anything goes wrong, restore from: ' + backupFile);

# Circle Physics

A desktop physics simulation app built with Tauri + React.

## Prerequisites

### 1. Install Rust
```bash
# Windows (run in PowerShell)
winget install Rustlang.Rustup

# Or download from https://rustup.rs
```

### 2. Install Node.js
Download from https://nodejs.org (LTS version recommended)

### 3. Windows-specific: Install Visual Studio Build Tools
Tauri requires C++ build tools on Windows:
- Download Visual Studio Build Tools from https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Install "Desktop development with C++" workload

## Setup

```bash
# Navigate to project directory
cd circle-physics

# Install Node dependencies
npm install

# Run in development mode
npm run tauri dev
```

## Build for Production

```bash
npm run tauri build
```

The executable will be in `src-tauri/target/release/`.

## Project Structure

```
circle-physics/
├── src/                    # React frontend
│   ├── main.tsx           # Entry point
│   ├── App.tsx            # Main component
│   └── styles.css         # Styles
├── src-tauri/             # Rust backend
│   ├── src/
│   │   └── main.rs        # Tauri commands
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri config
├── package.json           # Node dependencies
└── vite.config.ts         # Vite bundler config
```

## Development

- Frontend hot-reloads automatically when you edit React files
- Backend requires restart when you edit Rust files (Tauri CLI handles this)
- Open DevTools with F12 or right-click > Inspect

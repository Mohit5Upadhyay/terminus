<div align="center">

<!-- BANNER -->
<img src="https://raw.githubusercontent.com/anuj123upadhyay/terminus/main/assets/banner.png" alt="Terminus Banner" width="100%" />

<br />

# Terminus

### The terminal that understands you.

**A generative UI terminal powered by [Tambo AI](https://tambo.ai) — type naturally, get rich interactive visualizations instead of raw text.**

<br />

[Demo Video](#demo) · [Screenshots](#screenshots) · [Getting Started](#getting-started) · [Architecture](#architecture)

<br />

![Electron](https://img.shields.io/badge/Electron-40.1.0-47848F?style=flat-square&logo=electron&logoColor=white)
![Tambo AI](https://img.shields.io/badge/Tambo_AI-0.69.1-6366f1?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## What is Terminus?

Terminus replaces the traditional terminal experience with a **generative UI layer**. Instead of reading walls of text, you describe what you want in natural language — Tambo AI selects the right visualization and renders it as an interactive component on a drag-and-drop canvas.

> *"Show me what's on my Desktop"* → Interactive file grid with icons, sizes, and sorting  
> *"Any containers running?"* → Live Docker dashboard with start/stop controls  
> *"Recent commits"* → Visual commit graph with branches and authors

All backed by a **real PTY shell** — no simulation, no sandbox.

---

## Demo

<!-- Replace with your actual demo video/gif -->
<div align="center">

https://github.com/user-attachments/assets/YOUR_DEMO_VIDEO_ID

*☝️ Replace with your demo video link or GIF*

</div>

---

## Screenshots

<div align="center">

<!-- Replace with actual screenshots -->
| GenUI Canvas | File Explorer | System Monitor |
|:---:|:---:|:---:|
| <img src="https://raw.githubusercontent.com/anuj123upadhyay/terminus/main/assets/screenshot-canvas.png" width="280" /> | <img src="https://raw.githubusercontent.com/anuj123upadhyay/terminus/main/assets/screenshot-files.png" width="280" /> | <img src="https://raw.githubusercontent.com/anuj123upadhyay/terminus/main/assets/screenshot-system.png" width="280" /> |

*☝️ Replace with actual screenshots*

</div>

---

## GenUI Components

Tambo AI analyzes your intent and selects the best component — no hardcoded rules.

| Component | Triggered By | What It Renders |
|-----------|-------------|-----------------|
| **FileGrid** | *"show files"*, `ls`, *"what's on Desktop"* | Interactive file browser with sort, icons & navigation |
| **GitNetwork** | *"recent commits"*, `git log`, *"who changed this"* | Commit graph with branch refs & authors |
| **ContainerDash** | *"docker status"*, `docker ps`, *"any containers?"* | Live container dashboard with actions |
| **SystemMonitor** | *"system stats"*, `top`, *"how's my CPU?"* | Real-time CPU & memory gauges |
| **JsonExplorer** | `cat config.json`, *"show the JSON"* | Collapsible tree with syntax highlighting |
| **PackageInfo** | `cat package.json`, *"show dependencies"* | Package viewer with npm links |
| **FileViewer** | `cat file.ts`, *"open main.ts"* | Syntax-highlighted file viewer with edit & save |

---



### How It Works

```
User Input ──→ Tambo AI ──→ Tool Execution ──→ GenUI Component ──→ Canvas
   "show files"    ↓         listFiles()          FileGrid         drag & drop
              Intent Analysis                  with live data      + tabs
```





1. **You speak naturally** — type what you want, not shell syntax
2. **Tambo AI reasons** — analyzes intent, picks the right tool & component
3. **Backend executes** — real shell commands via IPC to Electron services
4. **GenUI renders** — interactive component appears on the canvas
5. **You interact** — drag, resize, tab between multiple components

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **AI Engine** | Tambo SDK `@tambo-ai/react` | GenUI component selection & rendering |
| **Desktop** | Electron 40 | Native app with secure IPC |
| **Terminal** | node-pty + xterm.js | Real PTY shell execution |
| **Frontend** | React 18 + TypeScript | Component rendering |
| **Canvas** | @dnd-kit | Drag-and-drop component layout |
| **Styling** | Tailwind CSS + Glassmorphism | Dark theme with depth |
| **Validation** | Zod | Type-safe component prop schemas |
| **Backend** | simple-git, dockerode, systeminformation | Native integrations |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A [Tambo AI API key](https://tambo.ai)

### Install & Run

```bash
git clone https://github.com/anuj123upadhyay/terminus.git
cd terminus

# Configure environment
cp .env.example .env
# Add your VITE_TAMBO_API_KEY to .env

# Install dependencies
npm install

# Rebuild native modules for Electron
npm rebuild node-pty

# Start development
npm run electron:dev
```

### Build for Production

```bash
npm run electron:build
```

Output binaries are generated in the `release/` directory for macOS, Windows, and Linux.

---

## Project Structure

```
terminus/
├── electron/              # Main process
│   ├── main.ts            # Window management, IPC handlers
│   ├── preload.ts         # Secure context bridge
│   └── services/          # Backend services
│       ├── shell.ts       # PTY shell management
│       ├── filesystem.ts  # File operations
│       ├── git.ts         # Git repository ops
│       ├── docker.ts      # Docker container ops
│       └── system.ts      # System monitoring
├── src/                   # Renderer process
│   ├── lib/
│   │   └── tambo.ts       # ⭐ Component registry + Zod schemas
│   ├── components/
│   │   ├── genui/         # 7 GenUI visualization components
│   │   ├── genui-terminal/# Split-pane layout (Chat + Canvas)
│   │   ├── tambo/         # Tambo chat UI primitives
│   │   └── ui/            # Canvas, tabs, welcome screen
│   └── styles/
│       └── global.css     # Design system tokens
└── package.json
```

---

## Why Tambo?

Terminus is built on the [Tambo AI SDK](https://tambo.ai) to demonstrate the power of **Generative UI** in developer tools:

- **Component-level AI** — Tambo doesn't just generate text; it selects and renders full React components with real data
- **Tool integration** — Zod-validated tools fetch live data from the OS before rendering
- **Schema-driven** — Every component has a Zod schema, ensuring type-safe AI ↔ UI contracts
- **Drag-and-drop canvas** — Components are first-class objects you can arrange, tab, and interact with

---

## License

MIT

---

<div align="center">

**Built with [Tambo AI](https://tambo.ai)** — Generative UI for the modern terminal.

</div>

# Copilot Instructions for Terminus

## Project Overview
Terminus is an **AI-powered terminal interface** built with Electron, Vite, React, and the **Tambo AI SDK**. It transforms raw terminal output into rich, interactive visualizations using intelligent GenUI component selection.

## Core Technologies
- **Electron v40.1.0** - Desktop app with contextIsolation, IPC bridge pattern
- **Tambo AI SDK v0.69.1** - AI-driven component selection (`@tambo-ai/react`)
- **node-pty** - Real PTY terminal with shell execution
- **xterm.js** - Terminal UI rendering
- **React 18 + TypeScript** - Renderer with path alias `@/` → `src/`
- **Vite** - Build tooling
- **Zod** - Schema validation for GenUI component props

## Project Structure
```
terminus/
├── electron/           # Main process
│   ├── main.ts        # Electron main, IPC handlers
│   ├── preload.ts     # Secure IPC bridge
│   └── services/      # Backend services
│       ├── docker.ts  # Docker container management
│       ├── filesystem.ts # File operations
│       ├── git.ts     # Git repository operations
│       ├── shell.ts   # Shell/PTY management
│       └── system.ts  # System monitoring
├── src/               # Renderer process
│   ├── lib/           # Core libraries
│   │   ├── tambo.ts         # Tambo SDK config & component registry
│   │   ├── tamboAI.ts       # ⭐ AI Component Selection Engine
│   │   └── ipc.ts           # Type-safe IPC client
│   └── components/    # React components
│       ├── terminal/  # Terminal UI
│       ├── genui/     # 6 GenUI visualization components
│       └── TamboChat.tsx # AI chat panel with intelligent selection
└── src/styles/
    └── global.css     # Glassmorphism design system
```

## ⭐ AI Component Selection (tamboAI.ts)
The core innovation - **Tambo AI decides which visualization to show**:

### How It Works
1. User types natural language request (e.g., "what's on my desktop?")
2. `selectComponentWithAI()` analyzes intent using semantic patterns
3. AI selects the best component based on:
   - Natural language understanding
   - Environmental context (is this a git repo? is Docker running?)
   - Ambiguity resolution
4. Shows reasoning to user in professional toast
5. Renders selected GenUI component with fetched data

### Natural Language Examples
| User Says | AI Understands | Component |
|-----------|---------------|-----------|
| "what's on my desktop?" | File browsing intent | FileGrid |
| "show recent commits" | Git history request | GitNetwork |
| "any containers running?" | Docker status check | ContainerDash |
| "how's my system doing?" | System monitoring | SystemMonitor |
| "show package dependencies" | NPM package info | PackageInfo |

## GenUI Components (AI-Selected)
These components are registered with Tambo AI for intelligent selection:

| Component | Trigger Commands | Purpose |
|-----------|-----------------|---------|
| `FileGrid` | ls, dir, ll, find | Interactive file browser |
| `GitNetwork` | git log | Commit history with graph |
| `ContainerDash` | docker ps, docker stats | Container management |
| `SystemMonitor` | top, htop, ps aux | CPU/memory gauges |
| `JsonExplorer` | cat *.json | Collapsible JSON tree |
| `PackageInfo` | cat package.json | NPM package viewer |

## Chat Commands (TamboChat)
The AI chat panel supports these commands:

### Navigation
- `pwd` - Show current working directory
- `cd Desktop` - Change to Desktop directory
- `cd ..` - Go to parent directory
- `cd ~` - Go to home directory

### Docker Commands
- `docker ps` - List all containers
- `docker stats` - Show container resource usage
- `docker start <name>` - Start a stopped container
- `docker stop <name>` - Stop a running container
- `docker restart <name>` - Restart a container
- `docker rm <name>` - Remove a container

### File Operations
- `ls` or `show files` - List files in current directory
- `ls Desktop` - List files on Desktop

### Other
- `git history` - Show commit history
- `system stats` - Show CPU/memory usage

## Development Commands
```bash
npm run electron:dev   # Development mode
npm run electron:build # Production build
npm run build          # Vite build only
```

## Code Conventions

### IPC Pattern
All Electron IPC goes through typed wrappers in `src/lib/ipc.ts`:
```typescript
import { fs, git, docker, shell, system } from "@/lib/ipc";

// Use the typed services
const files = await fs.listDir("/path");
const commits = await git.log(cwd, 30);
```

### Tambo Integration
Component registration in `src/lib/tambo.ts`:
```typescript
export const components: TamboComponent[] = [
    {
        name: "FileGrid",
        description: "TRIGGERS: ls, dir commands...",
        component: FileGrid,
        propsSchema: fileGridSchema,
    },
    // ...
];
```

### GenUI Component Pattern
All GenUI components follow this structure:
```typescript
interface Props {
    data: SomeDataType;
}

export function ComponentName({ data }: Props) {
    // Handle empty state
    if (!data || data.length === 0) {
        return <EmptyState />;
    }
    
    // Render visualization
    return <div className="glass-panel">...</div>;
}
```

### CSS Variables
Use the established design tokens:
```css
--terminus-bg: #0d1117;
--terminus-fg: #c9d1d9;
--terminus-green: #3fb950;
--terminus-blue: #58a6ff;
--glass-bg: rgba(22, 27, 34, 0.85);
--glass-border: rgba(48, 54, 61, 0.6);
```

## AI Integration Key Points

### The Core Innovation
Terminus uses **Tambo AI to decide which visualization to show** based on command output patterns, not hardcoded if/else rules.

### Output Parser Flow
1. User runs command → raw output captured
2. `parseOutput()` calls `analyzeWithTamboAI()`
3. AI analyzes patterns and selects component
4. Decision logged with confidence score
5. Component rendered with fetched data

### Making AI Visible
- Console logging with 🤖 emojis for demo visibility
- UI toast showing "Tambo AI selected: ComponentName"
- Confidence percentage displayed

## Hackathon Focus Areas
1. **AI Component Selection** - Tambo SDK makes the decisions
2. **Real Terminal** - node-pty for actual shell execution
3. **GenUI Components** - 6 rich visualizations
4. **Error Handling** - Graceful Docker/Git unavailable states
5. **Design** - Glassmorphism with smooth animations

## Important Files for Features
- **New GenUI Component**: Add to `src/components/genui/`, register in `tambo.ts`
- **New IPC Service**: Add to `electron/services/`, expose in `preload.ts`
- **Styling**: Use `global.css` with existing CSS variables

## Testing Locally
1. `npm install`
2. `npm run electron:dev`
3. Run commands in terminal:
   - `ls -la` → FileGrid
   - `git log` → GitNetwork
   - `docker ps` → ContainerDash
   - `cat package.json` → PackageInfo

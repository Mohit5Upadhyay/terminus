"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShellService = void 0;
// Shell Service - manages the PTY process
const pty = __importStar(require("node-pty"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class ShellService {
    ptyProcess = null;
    window;
    cwd;
    constructor(window) {
        this.window = window;
        this.cwd = os_1.default.homedir();
    }
    spawn() {
        if (this.ptyProcess) {
            this.kill();
        }
        const shell = this.getDefaultShell();
        console.log(`[ShellService] Spawning shell: ${shell}`);
        console.log(`[ShellService] CWD: ${this.cwd}`);
        try {
            this.ptyProcess = pty.spawn(shell, [], {
                name: "xterm-256color",
                cols: 80,
                rows: 24,
                cwd: this.cwd,
                env: {
                    ...process.env,
                    TERM: "xterm-256color",
                    COLORTERM: "truecolor",
                },
            });
            this.ptyProcess.onData((data) => {
                if (this.window && !this.window.isDestroyed()) {
                    this.window.webContents.send("shell:data", data);
                }
                this.trackCwdChange(data);
            });
            this.ptyProcess.onExit(({ exitCode }) => {
                if (this.window && !this.window.isDestroyed()) {
                    this.window.webContents.send("shell:exit", exitCode);
                }
            });
            console.log("[ShellService] Shell spawned successfully");
        }
        catch (error) {
            console.error("[ShellService] Failed to spawn shell:", error);
            throw error;
        }
    }
    write(data) {
        this.ptyProcess?.write(data);
    }
    resize(cols, rows) {
        try {
            this.ptyProcess?.resize(cols, rows);
        }
        catch (error) {
            console.error("Failed to resize PTY:", error);
        }
    }
    kill() {
        try {
            this.ptyProcess?.kill();
        }
        catch (error) {
            console.error("Failed to kill PTY:", error);
        }
        this.ptyProcess = null;
    }
    getCwd() {
        return this.cwd;
    }
    setCwd(newCwd) {
        this.cwd = newCwd;
    }
    getDefaultShell() {
        if (process.platform === "win32") {
            return process.env.COMSPEC || "powershell.exe";
        }
        // Try SHELL env var first
        if (process.env.SHELL && fs_1.default.existsSync(process.env.SHELL)) {
            return process.env.SHELL;
        }
        // Try common shell paths on macOS/Linux
        const commonShells = [
            "/bin/zsh",
            "/bin/bash",
            "/usr/bin/zsh",
            "/usr/bin/bash",
            "/bin/sh",
        ];
        for (const shell of commonShells) {
            if (fs_1.default.existsSync(shell)) {
                console.log(`[ShellService] Found shell:  ${shell}`);
                return shell;
            }
        }
        console.warn("[ShellService] No shell found, using /bin/sh");
        return "/bin/sh";
    }
    trackCwdChange(data) {
        // OSC 7 escape sequence for CWD (used by modern shells)
        const osc7Match = data.match(/\x1b\]7;file:\/\/[^\/]*([^\x07\x1b]*)/);
        if (osc7Match) {
            this.cwd = decodeURIComponent(osc7Match[1]);
            return;
        }
        // Try to detect from prompt (basic heuristic)
        const pwdMatch = data.match(/(?:^|\n)([\/~][^\n\r]*)\s*[$#%>]\s*$/);
        if (pwdMatch) {
            let detectedPath = pwdMatch[1].trim();
            if (detectedPath.startsWith("~")) {
                detectedPath = path_1.default.join(os_1.default.homedir(), detectedPath.slice(1));
            }
            if (path_1.default.isAbsolute(detectedPath)) {
                this.cwd = detectedPath;
            }
        }
    }
}
exports.ShellService = ShellService;

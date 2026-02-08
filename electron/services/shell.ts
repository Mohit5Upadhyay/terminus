// Shell Service - manages the PTY process
import * as pty from "node-pty";
import { BrowserWindow } from "electron";
import os from "os";
import path from "path";
import fs from "fs";

export class ShellService {
    private ptyProcess: pty.IPty | null = null;
    private window: BrowserWindow;
    private cwd: string;

    constructor(window: BrowserWindow) {
        this.window = window;
        this.cwd = os.homedir();
    }

    spawn(): void {
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
                } as any,
            });

            this.ptyProcess.onData((data: string) => {
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
        } catch (error) {
            console.error("[ShellService] Failed to spawn shell:", error);
            throw error;
        }
    }

    write(data: string): void {
        this.ptyProcess?.write(data);
    }

    resize(cols: number, rows: number): void {
        try {
            this.ptyProcess?.resize(cols, rows);
        } catch (error) {
            console.error("Failed to resize PTY:", error);
        }
    }

    kill(): void {
        try {
            this.ptyProcess?.kill();
        } catch (error) {
            console.error("Failed to kill PTY:", error);
        }
        this.ptyProcess = null;
    }

    getCwd(): string {
        return this.cwd;
    }

    setCwd(newCwd: string): void {
        this.cwd = newCwd;
    }

    private getDefaultShell(): string {
        if (process.platform === "win32") {
            return process.env.COMSPEC || "powershell.exe";
        }

        // Try SHELL env var first
        if (process.env.SHELL && fs.existsSync(process.env.SHELL)) {
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
            if (fs.existsSync(shell)) {
                console.log(`[ShellService] Found shell:  ${shell}`);
                return shell;
            }
        }

        console.warn("[ShellService] No shell found, using /bin/sh");
        return "/bin/sh";
    }

    private trackCwdChange(data: string): void {
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
                detectedPath = path.join(os.homedir(), detectedPath.slice(1));
            }
            if (path.isAbsolute(detectedPath)) {
                this.cwd = detectedPath;
            }
        }
    }
}

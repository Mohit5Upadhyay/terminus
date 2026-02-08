// Traditional Terminal Component
import { useEffect, useRef, useState } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";

import { shell, isElectron } from "@/lib/ipc";

export function Terminal() {
    const containerRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [isInElectron, setIsInElectron] = useState(false);

    // Initialize terminal
    useEffect(() => {
        if (!containerRef.current || xtermRef.current) return;

        const xterm = new XTerm({
            theme: {
                background: "#0d1117",
                foreground: "#c9d1d9",
                cursor: "#58a6ff",
                cursorAccent: "#0d1117",
                selectionBackground: "#264f78",
                black: "#484f58",
                red: "#ff7b72",
                green: "#3fb950",
                yellow: "#d29922",
                blue: "#58a6ff",
                magenta: "#bc8cff",
                cyan: "#39c5cf",
                white: "#b1bac4",
                brightBlack: "#6e7681",
                brightRed: "#ffa198",
                brightGreen: "#56d364",
                brightYellow: "#e3b341",
                brightBlue: "#79c0ff",
                brightMagenta: "#d2a8ff",
                brightCyan: "#56d4dd",
                brightWhite: "#ffffff",
            },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: 14,
            lineHeight: 1.25,
            cursorBlink: true,
            cursorStyle: "block",
            allowProposedApi: true,
            scrollback: 10000,
        });

        const fitAddon = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        xterm.loadAddon(fitAddon);
        xterm.loadAddon(webLinksAddon);
        xterm.open(containerRef.current);
        fitAddon.fit();

        xtermRef.current = xterm;
        fitAddonRef.current = fitAddon;

        const inElectron = isElectron();
        setIsInElectron(inElectron);

        if (inElectron && shell) {
            shell.onData((data) => {
                xterm.write(data);
            });

            // Handle shell exit
            shell.onExit((code) => {
                xterm.writeln(`\r\n[Process exited with code ${code}]`);
            });

            // Now spawn shell and get initial cwd
            shell.spawn();

            // Handle user input - pass directly to shell
            xterm.onData((data) => {
                shell.write(data);
            });

            // Handle resize
            const handleResize = () => {
                fitAddon.fit();
                shell.resize(xterm.cols, xterm.rows);
            };
            window.addEventListener("resize", handleResize);

            // Focus terminal
            xterm.focus();

            return () => {
                window.removeEventListener("resize", handleResize);
                shell.kill();
                xterm.dispose();
            };
        } else {
            xterm.writeln("\x1b[1;33m⚠ Terminus requires Electron\x1b[0m");
            xterm.writeln("");
            xterm.writeln("Run with: \x1b[1;36mnpm run electron:dev\x1b[0m");
            xterm.writeln("");
            xterm.writeln("\x1b[90mThis terminal connects to real shell via node-pty,");
            xterm.writeln("which is only available in the Electron environment.\x1b[0m");

            return () => {
                xterm.dispose();
            };
        }
    }, []);

    // Update cwd periodically (only in Electron) - for potential future use
    useEffect(() => {
        if (!isInElectron || !shell) return;

        const interval = setInterval(async () => {
            try {
                await shell.getCwd();
            } catch {
                console.error("Failed to get shell cwd - shell might have exited");
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isInElectron]);

    return (
        <div className="flex flex-col h-full bg-[#0d1117]">
            <div className="flex-1 min-h-0">
                <div ref={containerRef} className="h-full w-full" />
            </div>
        </div>
    );
}

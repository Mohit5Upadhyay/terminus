import { useState, useEffect } from "react";
import { Terminal } from "./components/terminal/Terminal";
import { GenUITerminal } from "./components/genui-terminal";
import { Terminal as TerminalIcon, Sparkles } from "lucide-react";

type TerminalMode = 'normal' | 'genui';


function App() {
    const [mode, setMode] = useState<TerminalMode>(() => {
        const saved = localStorage.getItem('terminus-mode');
        return (saved === 'genui' ? 'genui' : 'normal') as TerminalMode;
    });

    // Persist mode to localStorage
    useEffect(() => {
        localStorage.setItem('terminus-mode', mode);
    }, [mode]);

    return (
        <div className="dark flex flex-col h-screen bg-background text-foreground">
            {/* Top Header - Mode Switcher */}
            <header className="flex-shrink-0 h-12 border-b border-border bg-card flex items-center justify-between px-4 py-8">
                {/* Title */}
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#58a6ff]">⌘</span>
                    <h1 className="text-sm font-semibold text-foreground">Terminus</h1>
                    <span className="text-xs text-muted-foreground ml-2 welcome-gradient-text">
                        {mode === 'genui' ? ' Generative Terminal' : 'Traditional Terminal'}
                    </span>
                </div>

                {/* Mode Switcher Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMode('normal')}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                            transition-colors duration-200
                            ${mode === 'normal' 
                                ? 'bg-[#238636] text-white' 
                                : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
                            }
                        `}
                        title="Traditional Terminal (xterm.js)"
                    >
                        <TerminalIcon size={14} />
                        <span>Normal</span>
                    </button>
                    <button
                        onClick={() => setMode('genui')}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md
                            transition-colors duration-200
                            ${mode === 'genui' 
                                ? 'bg-[#8250df] text-white' 
                                : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
                            }
                        `}
                        title="Generative UI Terminal with AI"
                    >
                        <Sparkles size={14} />
                        <span>GenUI</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area - Takes Remaining Height */}
            <main className="flex-1 min-h-0 overflow-hidden">
                {mode === 'normal' ? (
                    <Terminal />
                ) : (
                    <GenUITerminal />
                )}
            </main>
        </div>
    );
}

export default App;

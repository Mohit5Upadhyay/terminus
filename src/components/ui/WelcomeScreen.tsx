import { Terminal, ArrowRight, Layers } from "lucide-react";

/**
 * Canvas Welcome Screen
 */
export function WelcomeScreen() {
    const capabilities = [
        { label: "Files", key: "files" },
        { label: "Git", key: "git" },
        { label: "Docker", key: "docker" },
        { label: "System", key: "system" },
        { label: "JSON", key: "json" },
        { label: "Packages", key: "packages" },
    ];

    return (
        <div className="h-full flex items-center justify-center p-8">
            <div className="max-w-lg w-full space-y-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="welcome-glow-icon">
                            <Terminal className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground">
                            Terminus - <span className="welcome-gradient-text"> Your's Generative Terminal</span>
                        </span>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight">
                            The terminal that<br />
                            <span className="welcome-gradient-text">understands you.</span>
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                            No more raw text output. Terminus uses Generative UI to turn 
                            every response into a rich, interactive component — automatically.
                        </p>
                    </div>
                </div>

                <div className="welcome-genui-section">
                    <div className="flex items-start gap-3">
                        <div className="welcome-genui-icon">
                            <Layers className="h-4 w-4" />
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-foreground/90">
                                Powered by Tambo AI
                            </p>
                            <p className="text-xs text-muted-foreground/70 leading-relaxed">
                                Traditional terminals give you walls of text. 
                                Tambo AI reads your intent and generates the right UI on the fly — 
                                file grids, git graphs, live dashboards, JSON trees — 
                                all rendered as real components you can interact with.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60">
                        GenUI Components
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {capabilities.map((cap) => (
                            <span
                                key={cap.key}
                                className="welcome-tag"
                            >
                                {cap.label}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="welcome-hint">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 mt-px" />
                    <span className="text-sm text-muted-foreground/60">
                        Try <span className="text-muted-foreground">"show me what's on my developer folder"</span> in the chat
                    </span>
                </div>
            </div>
        </div>
    );
}

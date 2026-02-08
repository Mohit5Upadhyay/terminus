/**
 * @file GenUITerminal.tsx
 * @description GenUI Terminal with Tambo AI - Split Layout with Chat and Canvas
 * 
 * Layout:
 * - Left Side: Tambo MessageThreadFull (official chat interface)
 * - Right Side: ComponentsCanvas for rendered components
 * - Header: Terminal mode switcher
 */

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import ComponentsCanvas from "@/components/ui/components-canvas";
import { InteractableCanvasDetails } from "@/components/ui/interactable-canvas-details";
import { InteractableTabs } from "@/components/ui/interactable-tabs";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { TamboMcpProvider } from "@tambo-ai/react/mcp";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const STORAGE_KEY = "terminus-context-key";

function getContextKey(): string {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
        key = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
}

export function GenUITerminal() {
    const mcpServers = useMcpServers();
    const [contextKey, setContextKey] = useState<string | null>(null);

    useEffect(() => {
        setContextKey(getContextKey());
    }, []);

    if (!contextKey) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0d1117]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="animate-spin text-[#58a6ff]" />
                    <h3 className="text-lg font-semibold text-[#c9d1d9]">Initializing Tambo AI...</h3>
                </div>
            </div>
        );
    }

    const apiKey = import.meta.env.VITE_TAMBO_API_KEY;
    const tamboUrl = import.meta.env.VITE_TAMBO_URL;

    if (!apiKey) {
        return (
            <div className="h-full flex items-center justify-center bg-[#0d1117]">
                <div className="flex flex-col items-center gap-4">
                    <h3 className="text-lg font-semibold text-[#f85149]">⚠️ Missing API Key</h3>
                    <p className="text-sm text-[#8b949e]">Please set VITE_TAMBO_API_KEY in your .env file</p>
                </div>
            </div>
        );
    }

    return (
        <TamboProvider
            apiKey={apiKey}
            tamboUrl={tamboUrl}
            components={components}
            tools={tools}
            mcpServers={mcpServers}
            contextKey={contextKey}
        >
            <TamboMcpProvider>
                <div className="dark flex h-full bg-background">
                    <div className="flex-1 min-w-0 border-r border-border bg-card">
                        <MessageThreadFull className="h-full" />
                    </div>

                    <div className="w-[60%] flex flex-col bg-background">
                        <InteractableTabs interactableId="Tabs" />

                        <InteractableCanvasDetails interactableId="CanvasDetails" />

                        <div className="flex-1 overflow-auto">
                            <ComponentsCanvas className="h-full" />
                        </div>
                    </div>
                </div>
            </TamboMcpProvider>
        </TamboProvider>
    );
}

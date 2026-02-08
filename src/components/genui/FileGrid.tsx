// File Grid - Interactive file listing component with Tambo 
import { useState, useMemo, useEffect } from "react";
import { Folder, File, Image, Code, FileJson, FileText, Settings, ChevronUp, ChevronDown, Grid3x3, List, Terminal, AlertCircle } from "lucide-react";
import type { FileEntry } from "@/lib/ipc";

interface FileGridProps {
    path?: string;
    files?: FileEntry[];
    onNavigate?: (newPath: string) => void;
}

type ViewMode = "grid" | "list";
type SortKey = "name" | "size" | "modified";
type SortDir = "asc" | "desc";

const FILE_ICONS: Record<string, React.ElementType> = {
    folder: Folder,
    ts: Code,
    tsx: Code,
    js: Code,
    jsx: Code,
    json: FileJson,
    md: FileText,
    txt: FileText,
    png: Image,
    jpg: Image,
    jpeg: Image,
    svg: Image,
    gif: Image,
    config: Settings,
    default: File,
};

function getFileIcon(entry: FileEntry): React.ElementType {
    if (!entry || typeof entry !== 'object') return FILE_ICONS.default;
    if (entry.isDirectory) return FILE_ICONS.folder;
    if (entry.extension && FILE_ICONS[entry.extension]) {
        return FILE_ICONS[entry.extension];
    }
    if (entry.name && entry.name.includes("config")) return FILE_ICONS.config;
    return FILE_ICONS.default;
}

function formatSize(bytes: number): string {
    if (bytes === 0) return "-";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(isoString: string): string {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function FileGrid({ path, files, onNavigate }: FileGridProps) {
    const [filesState, setFiles] = useState<FileEntry[]>(files || []);
    const [loading, setLoading] = useState(!(files && files.length > 0));
    const [error, setError] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [showHidden, setShowHidden] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [resolvedPath, setResolvedPath] = useState<string>(path || "");
    const [lastFetchedPath, setLastFetchedPath] = useState<string | null>(null);
    const [commandInfo, setCommandInfo] = useState<string | null>(null);

    const isValidMacPath = (p: string | undefined): boolean => {
        if (!p) return false;
        return p.startsWith("/Users/") ||
            p.startsWith("/var/") ||
            p.startsWith("/tmp/") ||
            p.startsWith("/Applications/") ||
            p.startsWith("/System/") ||
            p.startsWith("/Library/") ||
            p.startsWith("/Volumes/") ||
            p === "/" ||
            p === "~" ||
            p.startsWith("~/");
    };

    useEffect(() => {
        if (files && files.length > 0) {
            setFiles(files);
            setResolvedPath(path || "Provided Files");
            setLoading(false);
            return;
        }

        let targetPath: string | null = null;
        if (isValidMacPath(path)) {
            targetPath = path!;
        }

        if (targetPath && targetPath === lastFetchedPath) {
            return;
        }

        let isMounted = true;

        const fetchFiles = async () => {
            setLoading(true);
            setError(null);

            try {
                const { fs, shell } = await import("@/lib/ipc");
                let finalPath: string;

                if (targetPath) {
                    finalPath = targetPath;
                } else {
                    if (path) {
                        console.warn("[FileGrid] Ignoring invalid path:", path);
                    }
                    try {
                        finalPath = await shell.getCwd();
                    } catch (cwdError) {
                        console.error("[FileGrid] Could not get CWD:", cwdError);
                        throw new Error("Could not determine current directory");
                    }
                }

                setCommandInfo(`fs.listDir("${finalPath}")`);
                const pathExists = await fs.exists(finalPath);
                if (!pathExists) {
                    throw new Error(`Path does not exist: ${finalPath}`);
                }

                const data = await fs.listDir(finalPath);

                if (isMounted) {
                    setFiles(data);
                    setResolvedPath(finalPath);
                    setLastFetchedPath(finalPath);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.error("[FileGrid] Error fetching files:", err);
                    setError(`Error: ${(err as Error).message}`);
                    setLoading(false);
                }
            }
        };

        fetchFiles();
        return () => {
            isMounted = false;
        };
    }, [path, files]);

    const sortedFiles = useMemo(() => {
        if (!filesState || !Array.isArray(filesState)) return [];
        
        let filtered = filesState.filter((f) => {
            if (!f || typeof f !== 'object' || !f.name || typeof f.path !== 'string') {
                return false;
            }
            return showHidden || !f.isHidden;
        });

        return [...filtered].sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;

            let cmp = 0;
            switch (sortKey) {
                case "name":
                    cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                    break;
                case "size":
                    cmp = a.size - b.size;
                    break;
                case "modified":
                    cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime();
                    break;
            }
            return sortDir === "asc" ? cmp : -cmp;
        });
    }, [filesState, sortKey, sortDir, showHidden]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const SortIcon = sortDir === "asc" ? ChevronUp : ChevronDown;

    if (error) {
        return (
            <div className="p-6 bg-destructive/10 border border-destructive rounded-lg">
                <div className="flex items-center gap-2 text-destructive mb-2">
                    <AlertCircle size={20} />
                    <h3 className="font-semibold">Error Loading Files</h3>
                </div>
                <p className="text-sm text-muted-foreground">{error}</p>
                {commandInfo && (
                    <div className="mt-3 p-2 bg-muted/50 rounded text-xs font-mono text-muted-foreground">
                        <Terminal size={12} className="inline mr-1" />
                        {commandInfo}
                    </div>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading files...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card text-card-foreground rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Terminal size={12} />
                        <span className="font-mono truncate">{commandInfo || 'File Explorer'}</span>
                    </div>
                    <h3 className="text-sm font-semibold truncate" title={resolvedPath}>
                        {resolvedPath || path || "Current Directory"}
                    </h3>
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-foreground transition-colors">
                        <input
                            type="checkbox"
                            checked={showHidden}
                            onChange={(e) => setShowHidden(e.target.checked)}
                            className="w-3 h-3 rounded border-border"
                        />
                        <span>Hidden</span>
                    </label>
                    <div className="flex border border-border rounded overflow-hidden">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                            title="List view"
                        >
                            <List size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                            title="Grid view"
                        >
                            <Grid3x3 size={14} />
                        </button>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">
                        {sortedFiles.length} {sortedFiles.length === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {viewMode === "list" ? (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/50 border-b border-border">
                            <tr>
                                <th 
                                    onClick={() => handleSort("name")} 
                                    className="text-left p-3 cursor-pointer hover:bg-muted/70 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-1">
                                        Name {sortKey === "name" && <SortIcon size={14} />}
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort("size")} 
                                    className="text-right p-3 cursor-pointer hover:bg-muted/70 transition-colors select-none"
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Size {sortKey === "size" && <SortIcon size={14} />}
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort("modified")} 
                                    className="text-right p-3 cursor-pointer hover:bg-muted/70 transition-colors select-none"
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Modified {sortKey === "modified" && <SortIcon size={14} />}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedFiles.map((file, index) => {
                                if (!file || !file.path) return null;
                                
                                const Icon = getFileIcon(file);
                                const isClickable = file.isDirectory && onNavigate;

                                return (
                                    <tr
                                        key={file.path || `file-${index}`}
                                        className={`
                                            border-b border-border/50 transition-colors
                                            ${isClickable ? "cursor-pointer hover:bg-muted/50" : ""}
                                            ${file.isHidden ? "opacity-60" : ""}
                                        `}
                                        onClick={() => isClickable && onNavigate(file.path)}
                                    >
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Icon
                                                    size={16}
                                                    className={file.isDirectory ? "text-blue-500" : "text-muted-foreground"}
                                                />
                                                <span className="truncate">
                                                    {file.name}
                                                    {isClickable && <span className="text-muted-foreground ml-1">→</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right text-muted-foreground">
                                            {file.isDirectory ? "—" : formatSize(file.size)}
                                        </td>
                                        <td className="p-3 text-right text-muted-foreground text-xs">
                                            {formatDate(file.modified)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
                        {sortedFiles.map((file, index) => {
                            if (!file || !file.path) return null;
                            
                            const Icon = getFileIcon(file);
                            const isClickable = file.isDirectory && onNavigate;

                            return (
                                <div
                                    key={file.path || `file-grid-${index}`}
                                    className={`
                                        relative p-3 rounded-lg border border-border transition-all
                                        ${isClickable ? "cursor-pointer hover:bg-muted/50" : ""}
                                        ${file.isHidden ? "opacity-60" : ""}
                                    `}
                                    onClick={() => isClickable && onNavigate(file.path)}
                                >
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <Icon
                                            size={32}
                                            className={file.isDirectory ? "text-blue-500" : "text-muted-foreground"}
                                        />
                                        <span className="text-xs truncate w-full" title={file.name}>
                                            {file.name}
                                        </span>
                                        {!file.isDirectory && (
                                            <span className="text-xs text-muted-foreground">
                                                {formatSize(file.size)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {sortedFiles.length === 0 && (
                <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
                    <div className="text-center">
                        <Folder size={48} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No files to display</p>
                        {!showHidden && (
                            <p className="text-xs mt-1">Try enabling "Show hidden files"</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Git Network - Component to display git commit history in a network graph format
import { useState, useEffect } from "react";
import { GitBranch, Tag, User } from "lucide-react";
import type { GitCommit } from "@/lib/ipc";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

interface GitNetworkProps {
    path?: string;
    commits?: GitCommit[];
    branch?: string | null;
}

function formatDate(dateString: string): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return `${diffMins}m ago`;
        }
        return `${diffHours}h ago`;
    }
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GitNetwork({ path, commits, branch }: GitNetworkProps) {
    const [commitsState, setCommits] = useState<GitCommit[]>(commits || []);
    const [branchState, setBranch] = useState<string | null>(branch || null);
    const [loading, setLoading] = useState(!(commits && commits.length > 0));
    const [error, setError] = useState<string | null>(null);
    const [resolvedPath, setResolvedPath] = useState<string>(path || "");
    const [lastFetchedPath, setLastFetchedPath] = useState<string | null>(null);

    const isValidMacPath = (p: string | undefined): boolean => {
        if (!p) return false;
        return p.startsWith("/Users/") ||
            p.startsWith("/var/") ||
            p.startsWith("/tmp/") ||
            p.startsWith("/Applications/") ||
            p.startsWith("/Volumes/") ||
            p === "/";
    };

    useEffect(() => {
        if (commits && commits.length > 0) {
            setCommits(commits);
            setBranch(branch || null);
            setResolvedPath(path || "Provided Commits");
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

        const fetchGitData = async () => {
            setLoading(true);
            setError(null);

            try {
                const { git, shell } = await import("@/lib/ipc");

                let finalPath: string;

                if (targetPath) {
                    finalPath = targetPath;
                } else {
                    if (path) {
                        console.warn("[GitNetwork] Ignoring invalid path:", path);
                    }
                    try {
                        finalPath = await shell.getCwd();
                    } catch (cwdError) {
                        throw new Error("Could not determine current directory");
                    }
                }

                if (!isMounted) return;

                const isRepo = await git.isRepo(finalPath);
                if (!isRepo) {
                    throw new Error("Not a git repository");
                }

                const [logData, statusData] = await Promise.all([
                    git.log(finalPath, 20),
                    git.status(finalPath)
                ]);

                if (isMounted) {
                    setCommits(logData);
                    setBranch(statusData.current);
                    setResolvedPath(finalPath);
                    setLastFetchedPath(finalPath);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    console.error("[GitNetwork] Error fetching git data:", err);
                    setError((err as Error).message);
                    setLoading(false);
                }
            }
        };

        fetchGitData();

        return () => {
            isMounted = false;
        };
    }, [path, commits, branch, lastFetchedPath]);

    if (error) {
        return (
            <ErrorState
                title="Git Repository Error"
                message={error.includes("not a git repository")
                    ? "This directory is not a Git repository. Initialize with 'git init' or navigate to a Git repo."
                    : `Failed to load git history: ${error}`}
            />
        );
    }

    if (loading) return <LoadingState message="Loading git history..." />;
    if (commitsState.length === 0) return <div className="git-empty">🌿 No commits found</div>;

    return (
        <div className="git-network">
            <div className="git-network-header">
                <GitBranch size={16} className="branch-icon" />
                <span className="branch-name">{branchState || "HEAD"}</span>
                <span className="commit-count">{commitsState.length} commits</span>
                {resolvedPath && (
                    <span className="git-path" title={resolvedPath}>
                        {resolvedPath.split("/").slice(-2).join("/")}
                    </span>
                )}
            </div>

            <div className="git-commit-list">
                {commitsState.map((commit, index) => (
                    <div key={commit.hash} className="git-commit-row">
                        <div className="git-graph">
                            <div className="git-line-top" style={{ opacity: index === 0 ? 0 : 1 }} />
                            <div className="git-node" />
                            <div className="git-line-bottom" style={{ opacity: index === commitsState.length - 1 ? 0 : 1 }} />
                        </div>

                        <div className="git-commit-content">
                            <div className="git-commit-header">
                                <code className="git-hash">{commit.shortHash}</code>
                                {commit.refs.length > 0 && (
                                    <div className="git-refs">
                                        {commit.refs.map((ref) => (
                                            <span
                                                key={ref}
                                                className={"git-ref " + (ref.startsWith("tag:") ? "tag" : "branch")}
                                            >
                                                {ref.startsWith("tag:") ? (
                                                    <Tag size={10} />
                                                ) : (
                                                    <GitBranch size={10} />
                                                )}
                                                {ref.replace("tag: ", "").replace("HEAD -> ", "")}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="git-commit-message">{commit.message}</div>
                            <div className="git-commit-meta">
                                <User size={12} />
                                <span>{commit.author}</span>
                                <span className="git-date">{formatDate(commit.date)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Container Dash - Docker container dashboard
import { useState, useEffect } from "react";
import { Play, Square, RotateCcw, Trash2, Box } from "lucide-react";
import { docker } from "@/lib/ipc";
import type { DockerContainer } from "@/lib/ipc";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

interface ContainerDashProps {
    containers?: DockerContainer[];
}

function getStateColor(state: string): string {
    switch (state.toLowerCase()) {
        case "running":
            return "var(--terminus-green)";
        case "exited":
            return "var(--terminus-red)";
        case "paused":
            return "var(--terminus-yellow)";
        case "restarting":
            return "var(--terminus-blue)";
        default:
            return "var(--terminus-fg)";
    }
}

function formatCreated(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ContainerDash({ containers }: ContainerDashProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [fetching, setFetching] = useState(!(containers && containers.length > 0));
    const [containerList, setContainerList] = useState(containers || []);
    const [hasFetched, setHasFetched] = useState(false);
    const [dockerError, setDockerError] = useState<'docker-not-running' | 'unknown' | null>(null);

    useEffect(() => {
        // Skip if containers were provided or we already fetched
        if ((containers && containers.length > 0) || hasFetched) {
            if (containers && containers.length > 0) {
                setFetching(false);
            }
            return;
        }

        let mounted = true;
        setFetching(true);
        setDockerError(null);

        docker.containers(true)
            .then((data) => {
                if (mounted) {
                    setContainerList(data);
                    setFetching(false);
                    setHasFetched(true);
                    setDockerError(null);
                }
            })
            .catch((err) => {
                console.error("Failed to load containers:", err);
                if (mounted) {
                    const errMsg = err?.message?.toLowerCase() || '';
                    if (errMsg.includes('cannot connect') ||
                        errMsg.includes('enoent') ||
                        errMsg.includes('econnrefused') ||
                        errMsg.includes('not running')) {
                        setDockerError('docker-not-running');
                    } else {
                        setDockerError('unknown');
                    }
                    setFetching(false);
                    setHasFetched(true);
                }
            });

        return () => { mounted = false; };
    }, [containers, hasFetched]);

    const handleAction = async (id: string, action: "start" | "stop" | "restart" | "remove") => {
        setLoading(`${id}-${action}`);
        try {
            await docker.action(id, action);
            const updated = await docker.containers(true);
            setContainerList(updated);
        } catch (error) {
            console.error(`Failed to ${action} container:`, error);
        } finally {
            setLoading(null);
        }
    };

    const runningCount = containerList.filter((c) => c.state === "running").length;
    const stoppedCount = containerList.filter((c) => c.state === "exited").length;

    // Error States
    if (dockerError === 'docker-not-running') {
        return (
            <ErrorState
                title="Docker Not Running"
                message="Docker daemon is not currently running. Start Docker Desktop to view and manage containers."
                action={{
                    label: "Install Docker",
                    onClick: () => window.open("https://docs.docker.com/get-docker/", "_blank")
                }}
            />
        );
    }

    if (dockerError === 'unknown') {
        return (
            <ErrorState
                title="Docker Error"
                message="Failed to connect to Docker. Please check your Docker installation and try again."
            />
        );
    }

    if (fetching) {
        return <LoadingState message="Loading Docker containers..." />;
    }

    return (
        <div className="container-dash">
            <div className="container-dash-header">
                <Box size={16} />
                <span>Docker Containers</span>
                <div className="container-stats">
                    <span className="stat running">{runningCount} running</span>
                    <span className="stat stopped">{stoppedCount} stopped</span>
                </div>
            </div>

            {/* Container List */}
            <div className="container-list">
                {containerList.length === 0 ? (
                    <div className="container-empty">No containers found</div>
                ) : (
                    containerList.map((container) => (
                        <div key={container.id} className="container-card">
                            {/* Status Indicator */}
                            <div
                                className="container-status"
                                style={{ backgroundColor: getStateColor(container.state) }}
                                title={container.state}
                            />

                            {/* Container Info */}
                            <div className="container-info">
                                <div className="container-name">{container.name}</div>
                                <div className="container-image">{container.image}</div>
                                <div className="container-meta">
                                    <span className="container-id">{container.id}</span>
                                    {container.ports && (
                                        <span className="container-ports">{container.ports}</span>
                                    )}
                                    <span className="container-created">
                                        {formatCreated(container.created)}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="container-actions">
                                {container.state === "running" ? (
                                    <>
                                        <button
                                            className="action-btn stop"
                                            onClick={() => handleAction(container.id, "stop")}
                                            disabled={loading !== null}
                                            title="Stop"
                                        >
                                            <Square size={14} />
                                        </button>
                                        <button
                                            className="action-btn restart"
                                            onClick={() => handleAction(container.id, "restart")}
                                            disabled={loading !== null}
                                            title="Restart"
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="action-btn start"
                                            onClick={() => handleAction(container.id, "start")}
                                            disabled={loading !== null}
                                            title="Start"
                                        >
                                            <Play size={14} />
                                        </button>
                                        <button
                                            className="action-btn remove"
                                            onClick={() => handleAction(container.id, "remove")}
                                            disabled={loading !== null}
                                            title="Remove"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

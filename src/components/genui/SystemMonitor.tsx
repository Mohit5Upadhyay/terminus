// System Monitor - Real-time system monitoring Dashboard with CPU, Memory usage and top processes
import { useEffect, useState } from "react";
import { Cpu, HardDrive, Activity, Clock } from "lucide-react";
import { system } from "@/lib/ipc";
import type { SystemInfo, ProcessInfo } from "@/lib/ipc";
import { LoadingState } from "./LoadingState";

interface SystemMonitorProps {
    info?: SystemInfo;
    processes?: ProcessInfo[];
}

function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(" ") || "< 1m";
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function Gauge({ value, label, icon: Icon }: { value: number; label: string; icon: React.ElementType }) {
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="gauge-container">
            <svg className="gauge-svg" viewBox="0 0 100 100">
                <circle
                    className="gauge-bg"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    strokeWidth="8"
                />
                <circle
                    className="gauge-value"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        stroke: value > 80 ? "var(--terminus-red)" : value > 60 ? "var(--terminus-yellow)" : "var(--terminus-green)",
                    }}
                />
            </svg>
            <div className="gauge-content">
                <Icon size={16} />
                <span className="gauge-percent">{value.toFixed(1)}%</span>
                <span className="gauge-label">{label}</span>
            </div>
        </div>
    );
}

export function SystemMonitor({ info, processes }: SystemMonitorProps) {
    const [infoState, setInfo] = useState<SystemInfo | undefined>(info);
    const [processesState, setProcesses] = useState<ProcessInfo[]>(processes || []);
    const [loading, setLoading] = useState(!info);

    // Initial fetch and auto-refresh
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                const [newInfo, newProcesses] = await Promise.all([
                    system.info(),
                    system.processes(15),
                ]);
                if (isMounted) {
                    setInfo(newInfo);
                    setProcesses(newProcesses);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Failed to refresh system info:", error);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        // Fetch immediately if no info provided
        if (!info) {
            fetchData();
        }

        // Auto-refresh every 2 seconds
        const interval = setInterval(fetchData, 2000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []); 

    if (loading || !infoState) {
        return <LoadingState message="Loading system monitor..." />;
    }

    return (
        <div className="system-monitor">
            <div className="system-header">
                <Activity size={16} />
                <span>{infoState.hostname}</span>
                <span className="system-os">{infoState.platform} {infoState.osVersion}</span>
            </div>

            <div className="system-gauges">
                <Gauge value={infoState.cpuUsage} label="CPU" icon={Cpu} />
                <Gauge value={infoState.memoryPercent} label="Memory" icon={HardDrive} />
            </div>

            <div className="system-stats">
                <div className="stat-item">
                    <span className="stat-label">Memory</span>
                    <span className="stat-value">
                        {formatBytes(infoState.memoryUsed)} / {formatBytes(infoState.memoryTotal)}
                    </span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">CPU</span>
                    <span className="stat-value">{infoState.cpuModel} ({infoState.cpuCores} cores)</span>
                </div>
                <div className="stat-item">
                    <Clock size={12} />
                    <span className="stat-label">Uptime</span>
                    <span className="stat-value">{formatUptime(infoState.uptime)}</span>
                </div>
            </div>

            <div className="process-table">
                <div className="process-header">
                    <span className="col-pid">PID</span>
                    <span className="col-name">Name</span>
                    <span className="col-cpu">CPU %</span>
                    <span className="col-mem">MEM %</span>
                </div>
                <div className="process-list">
                    {processesState.map((proc) => (
                        <div key={proc.pid} className="process-row">
                            <span className="col-pid">{proc.pid}</span>
                            <span className="col-name" title={proc.name}>{proc.name}</span>
                            <span className="col-cpu" style={{ color: proc.cpu > 50 ? "var(--terminus-red)" : undefined }}>
                                {proc.cpu.toFixed(1)}
                            </span>
                            <span className="col-mem">{proc.memory.toFixed(1)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

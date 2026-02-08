// System Service - real system information using systeminformation
import si from "systeminformation";

export interface SystemInfo {
    cpuUsage: number;
    memoryTotal: number;
    memoryUsed: number;
    memoryPercent: number;
    uptime: number;
    hostname: string;
    platform: string;
    osVersion: string;
    cpuModel: string;
    cpuCores: number;
}

export interface ProcessInfo {
    pid: number;
    name: string;
    cpu: number;
    memory: number;
    user: string;
    started: string;
}

export class SystemService {
    static async getInfo(): Promise<SystemInfo> {
        try {
            const [cpu, mem, osInfo, time, cpuInfo] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.osInfo(),
                si.time(),
                si.cpu(),
            ]);

            return {
                cpuUsage: Math.round(cpu.currentLoad * 100) / 100,
                memoryTotal: mem.total,
                memoryUsed: mem.used,
                memoryPercent: Math.round((mem.used / mem.total) * 10000) / 100,
                uptime: time.uptime,
                hostname: osInfo.hostname,
                platform: osInfo.platform,
                osVersion: osInfo.release,
                cpuModel: cpuInfo.brand,
                cpuCores: cpuInfo.cores,
            };
        } catch (error) {
            throw new Error(`Failed to get system info: ${(error as Error).message}`);
        }
    }

    static async getProcesses(limit: number = 20): Promise<ProcessInfo[]> {
        try {
            const processes = await si.processes();

            return processes.list
                .sort((a, b) => b.cpu - a.cpu)
                .slice(0, limit)
                .map((p) => ({
                    pid: p.pid,
                    name: p.name,
                    cpu: Math.round(p.cpu * 100) / 100,
                    memory: Math.round(p.mem * 100) / 100,
                    user: p.user || "unknown",
                    started: p.started || "",
                }));
        } catch (error) {
            throw new Error(`Failed to get processes: ${(error as Error).message}`);
        }
    }

    static async getCpuHistory(seconds: number = 60): Promise<number[]> {
        // This would need a background process to collect history
        // For now, return single current value
        const cpu = await si.currentLoad();
        return [cpu.currentLoad];
    }

    static formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);

        return parts.join(" ") || "< 1m";
    }

    static formatBytes(bytes: number): string {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }
}

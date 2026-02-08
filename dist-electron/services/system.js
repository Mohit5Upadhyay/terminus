"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemService = void 0;
// System Service - real system information using systeminformation
const systeminformation_1 = __importDefault(require("systeminformation"));
class SystemService {
    static async getInfo() {
        try {
            const [cpu, mem, osInfo, time, cpuInfo] = await Promise.all([
                systeminformation_1.default.currentLoad(),
                systeminformation_1.default.mem(),
                systeminformation_1.default.osInfo(),
                systeminformation_1.default.time(),
                systeminformation_1.default.cpu(),
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
        }
        catch (error) {
            throw new Error(`Failed to get system info: ${error.message}`);
        }
    }
    static async getProcesses(limit = 20) {
        try {
            const processes = await systeminformation_1.default.processes();
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
        }
        catch (error) {
            throw new Error(`Failed to get processes: ${error.message}`);
        }
    }
    static async getCpuHistory(seconds = 60) {
        // This would need a background process to collect history
        // For now, return single current value
        const cpu = await systeminformation_1.default.currentLoad();
        return [cpu.currentLoad];
    }
    static formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const parts = [];
        if (days > 0)
            parts.push(`${days}d`);
        if (hours > 0)
            parts.push(`${hours}h`);
        if (minutes > 0)
            parts.push(`${minutes}m`);
        return parts.join(" ") || "< 1m";
    }
    static formatBytes(bytes) {
        if (bytes === 0)
            return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }
}
exports.SystemService = SystemService;

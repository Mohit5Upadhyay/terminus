"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerService = void 0;
// Docker Service - real Docker operations using dockerode
const dockerode_1 = __importDefault(require("dockerode"));
class DockerService {
    static docker = null;
    static getDocker() {
        if (!this.docker) {
            this.docker = new dockerode_1.default();
        }
        return this.docker;
    }
    static async isAvailable() {
        try {
            const docker = this.getDocker();
            await docker.ping();
            return true;
        }
        catch {
            return false;
        }
    }
    static async listContainers(all = false) {
        try {
            const docker = this.getDocker();
            const containers = await docker.listContainers({ all });
            return containers.map((c) => ({
                id: c.Id.substring(0, 12),
                name: c.Names[0]?.replace(/^\//, "") || "",
                image: c.Image,
                state: c.State,
                status: c.Status,
                ports: this.formatPorts(c.Ports),
                created: c.Created,
            }));
        }
        catch (error) {
            throw new Error(`Docker not available: ${error.message}`);
        }
    }
    static async containerAction(containerId, action) {
        try {
            const docker = this.getDocker();
            const container = docker.getContainer(containerId);
            switch (action) {
                case "start":
                    await container.start();
                    break;
                case "stop":
                    await container.stop();
                    break;
                case "restart":
                    await container.restart();
                    break;
                case "remove":
                    await container.remove({ force: true });
                    break;
            }
        }
        catch (error) {
            throw new Error(`Failed to ${action} container: ${error.message}`);
        }
    }
    static async getStats() {
        try {
            const docker = this.getDocker();
            const containers = await docker.listContainers();
            const stats = await Promise.all(containers.map(async (c) => {
                try {
                    const container = docker.getContainer(c.Id);
                    const statsData = await container.stats({ stream: false });
                    const cpuDelta = statsData.cpu_stats.cpu_usage.total_usage -
                        statsData.precpu_stats.cpu_usage.total_usage;
                    const systemDelta = statsData.cpu_stats.system_cpu_usage -
                        statsData.precpu_stats.system_cpu_usage;
                    const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;
                    const memoryUsage = statsData.memory_stats.usage || 0;
                    const memoryLimit = statsData.memory_stats.limit || 1;
                    const memoryPercent = (memoryUsage / memoryLimit) * 100;
                    return {
                        id: c.Id.substring(0, 12),
                        name: c.Names[0]?.replace(/^\//, "") || "",
                        cpuPercent: Math.round(cpuPercent * 100) / 100,
                        memoryUsage: this.formatBytes(memoryUsage),
                        memoryLimit: this.formatBytes(memoryLimit),
                        memoryPercent: Math.round(memoryPercent * 100) / 100,
                    };
                }
                catch {
                    return null;
                }
            }));
            return stats.filter((s) => s !== null);
        }
        catch (error) {
            throw new Error(`Failed to get container stats: ${error.message}`);
        }
    }
    static formatPorts(ports) {
        return ports
            .filter((p) => p.PublicPort)
            .map((p) => `${p.PublicPort}->${p.PrivatePort}/${p.Type}`)
            .join(", ");
    }
    static formatBytes(bytes) {
        if (bytes === 0)
            return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }
}
exports.DockerService = DockerService;

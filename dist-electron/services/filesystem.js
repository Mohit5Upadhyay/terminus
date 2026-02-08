"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesystemService = void 0;
// Filesystem Service - real filesystem operations
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class FilesystemService {
    static async listDirectory(dirPath) {
        try {
            const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true });
            const files = await Promise.all(entries.map(async (entry) => {
                const fullPath = path_1.default.join(dirPath, entry.name);
                let stats;
                try {
                    stats = await promises_1.default.stat(fullPath);
                }
                catch {
                    stats = null;
                }
                return {
                    name: entry.name,
                    path: fullPath,
                    isDirectory: entry.isDirectory(),
                    size: stats?.size || 0,
                    modified: stats?.mtime.toISOString() || "",
                    extension: entry.isDirectory()
                        ? null
                        : path_1.default.extname(entry.name).slice(1) || null,
                    permissions: stats ? this.formatPermissions(stats.mode) : "",
                    isHidden: entry.name.startsWith("."),
                };
            }));
            // Sort: directories first, then alphabetically
            return files.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory)
                    return -1;
                if (!a.isDirectory && b.isDirectory)
                    return 1;
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
        }
        catch (error) {
            throw new Error(`Failed to list directory: ${error.message}`);
        }
    }
    static async readFile(filePath) {
        try {
            return await promises_1.default.readFile(filePath, "utf-8");
        }
        catch (error) {
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }
    static async writeFile(filePath, content) {
        try {
            // Safety: verify file exists before overwriting
            const stats = (0, fs_1.statSync)(filePath);
            if (stats.isDirectory()) {
                throw new Error("Cannot write to a directory");
            }
            await promises_1.default.writeFile(filePath, content, "utf-8");
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new Error(`Failed to write file: ${error.message}`);
        }
    }
    static exists(filePath) {
        return (0, fs_1.existsSync)(filePath);
    }
    static async getStats(filePath) {
        const stats = await promises_1.default.stat(filePath);
        return {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            isDirectory: stats.isDirectory(),
        };
    }
    static formatPermissions(mode) {
        // Convert to octal permission string (e.g., "755")
        return ((mode >> 6) & 7).toString() +
            ((mode >> 3) & 7).toString() +
            (mode & 7).toString();
    }
    static formatSize(bytes) {
        if (bytes === 0)
            return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }
    // Write operations - require user confirmation
    static async createDirectory(dirPath) {
        try {
            await promises_1.default.mkdir(dirPath, { recursive: false });
        }
        catch (error) {
            throw new Error(`Failed to create directory: ${error.message}`);
        }
    }
    static async createFile(filePath, content = "") {
        try {
            await promises_1.default.writeFile(filePath, content, "utf-8");
        }
        catch (error) {
            throw new Error(`Failed to create file: ${error.message}`);
        }
    }
    static async deleteFile(filePath) {
        try {
            const stats = await promises_1.default.stat(filePath);
            if (stats.isDirectory()) {
                throw new Error("Use deleteDirectory for directories");
            }
            await promises_1.default.unlink(filePath);
        }
        catch (error) {
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }
    static async deleteDirectory(dirPath) {
        try {
            await promises_1.default.rmdir(dirPath);
        }
        catch (error) {
            throw new Error(`Failed to delete directory: ${error.message}`);
        }
    }
    static async rename(oldPath, newPath) {
        try {
            await promises_1.default.rename(oldPath, newPath);
        }
        catch (error) {
            throw new Error(`Failed to rename: ${error.message}`);
        }
    }
    static async copyFile(sourcePath, destPath) {
        try {
            await promises_1.default.copyFile(sourcePath, destPath);
        }
        catch (error) {
            throw new Error(`Failed to copy file: ${error.message}`);
        }
    }
}
exports.FilesystemService = FilesystemService;

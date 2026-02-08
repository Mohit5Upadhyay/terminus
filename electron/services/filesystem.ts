// Filesystem Service - real filesystem operations
import fs from "fs/promises";
import { existsSync, statSync } from "fs";
import path from "path";

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modified: string;
    extension: string | null;
    permissions: string;
    isHidden: boolean;
}

export class FilesystemService {
    static async listDirectory(dirPath: string): Promise<FileEntry[]> {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            const files: FileEntry[] = await Promise.all(
                entries.map(async (entry) => {
                    const fullPath = path.join(dirPath, entry.name);
                    let stats;
                    try {
                        stats = await fs.stat(fullPath);
                    } catch {
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
                            : path.extname(entry.name).slice(1) || null,
                        permissions: stats ? this.formatPermissions(stats.mode) : "",
                        isHidden: entry.name.startsWith("."),
                    };
                })
            );

            // Sort: directories first, then alphabetically
            return files.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
        } catch (error) {
            throw new Error(`Failed to list directory: ${(error as Error).message}`);
        }
    }

    static async readFile(filePath: string): Promise<string> {
        try {
            return await fs.readFile(filePath, "utf-8");
        } catch (error) {
            throw new Error(`Failed to read file: ${(error as Error).message}`);
        }
    }

    static async writeFile(filePath: string, content: string): Promise<void> {
        try {
            // Safety: verify file exists before overwriting
            const stats = statSync(filePath);
            if (stats.isDirectory()) {
                throw new Error("Cannot write to a directory");
            }
            await fs.writeFile(filePath, content, "utf-8");
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new Error(`File not found: ${filePath}`);
            }
            throw new Error(`Failed to write file: ${(error as Error).message}`);
        }
    }

    static exists(filePath: string): boolean {
        return existsSync(filePath);
    }

    static async getStats(filePath: string): Promise<{
        size: number;
        modified: string;
        isDirectory: boolean;
    }> {
        const stats = await fs.stat(filePath);
        return {
            size: stats.size,
            modified: stats.mtime.toISOString(),
            isDirectory: stats.isDirectory(),
        };
    }

    private static formatPermissions(mode: number): string {
        // Convert to octal permission string (e.g., "755")
        return ((mode >> 6) & 7).toString() +
            ((mode >> 3) & 7).toString() +
            (mode & 7).toString();
    }

    static formatSize(bytes: number): string {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
    }

    // Write operations - require user confirmation
    static async createDirectory(dirPath: string): Promise<void> {
        try {
            await fs.mkdir(dirPath, { recursive: false });
        } catch (error) {
            throw new Error(`Failed to create directory: ${(error as Error).message}`);
        }
    }

    static async createFile(filePath: string, content: string = ""): Promise<void> {
        try {
            await fs.writeFile(filePath, content, "utf-8");
        } catch (error) {
            throw new Error(`Failed to create file: ${(error as Error).message}`);
        }
    }

    static async deleteFile(filePath: string): Promise<void> {
        try {
            const stats = await fs.stat(filePath);
            if (stats.isDirectory()) {
                throw new Error("Use deleteDirectory for directories");
            }
            await fs.unlink(filePath);
        } catch (error) {
            throw new Error(`Failed to delete file: ${(error as Error).message}`);
        }
    }

    static async deleteDirectory(dirPath: string): Promise<void> {
        try {
            await fs.rmdir(dirPath);
        } catch (error) {
            throw new Error(`Failed to delete directory: ${(error as Error).message}`);
        }
    }

    static async rename(oldPath: string, newPath: string): Promise<void> {
        try {
            await fs.rename(oldPath, newPath);
        } catch (error) {
            throw new Error(`Failed to rename: ${(error as Error).message}`);
        }
    }

    static async copyFile(sourcePath: string, destPath: string): Promise<void> {
        try {
            await fs.copyFile(sourcePath, destPath);
        } catch (error) {
            throw new Error(`Failed to copy file: ${(error as Error).message}`);
        }
    }
}


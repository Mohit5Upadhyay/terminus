import { contextBridge, ipcRenderer } from "electron";

export interface TerminusAPI {
    shell: {
        spawn: () => Promise<void>;
        write: (data: string) => Promise<void>;
        resize: (cols: number, rows: number) => Promise<void>;
        kill: () => Promise<void>;
        getCwd: () => Promise<string>;
        onData: (callback: (data: string) => void) => void;
        onExit: (callback: (code: number) => void) => void;
    };
    fs: {
        listDir: (path: string) => Promise<FileEntry[]>;
        readFile: (path: string) => Promise<string>;
        writeFile: (path: string, content: string) => Promise<void>;
        exists: (path: string) => Promise<boolean>;
        // Write operations
        createDir: (path: string) => Promise<void>;
        createFile: (path: string, content?: string) => Promise<void>;
        deleteFile: (path: string) => Promise<void>;
        deleteDir: (path: string) => Promise<void>;
        rename: (oldPath: string, newPath: string) => Promise<void>;
        copyFile: (sourcePath: string, destPath: string) => Promise<void>;
    };
    git: {
        log: (path: string, limit?: number) => Promise<GitCommit[]>;
        status: (path: string) => Promise<GitStatus>;
        branches: (path: string) => Promise<string[]>;
        isRepo: (path: string) => Promise<boolean>;
    };
    docker: {
        containers: (all?: boolean) => Promise<DockerContainer[]>;
        action: (id: string, action: string) => Promise<void>;
        stats: () => Promise<ContainerStats[]>;
        isAvailable: () => Promise<boolean>;
    };
    system: {
        info: () => Promise<SystemInfo>;
        processes: (limit?: number) => Promise<ProcessInfo[]>;
    };
}

interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modified: string;
    extension: string | null;
    permissions: string;
}

interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    email: string;
    date: string;
    refs: string[];
}

interface GitStatus {
    current: string | null;
    tracking: string | null;
    files: Array<{ path: string; status: string }>;
}

interface DockerContainer {
    id: string;
    name: string;
    image: string;
    state: string;
    status: string;
    ports: string;
    created: number;
}

interface ContainerStats {
    id: string;
    name: string;
    cpuPercent: number;
    memoryUsage: string;
    memoryLimit: string;
    memoryPercent: number;
}

interface SystemInfo {
    cpuUsage: number;
    memoryTotal: number;
    memoryUsed: number;
    memoryPercent: number;
    uptime: number;
    hostname: string;
    platform: string;
    osVersion: string;
}

interface ProcessInfo {
    pid: number;
    name: string;
    cpu: number;
    memory: number;
    user: string;
}

contextBridge.exposeInMainWorld("terminus", {
    shell: {
        spawn: () => ipcRenderer.invoke("shell:spawn"),
        write: (data: string) => ipcRenderer.invoke("shell:write", data),
        resize: (cols: number, rows: number) =>
            ipcRenderer.invoke("shell:resize", cols, rows),
        kill: () => ipcRenderer.invoke("shell:kill"),
        getCwd: () => ipcRenderer.invoke("shell:getCwd"),
        onData: (callback: (data: string) => void) => {
            ipcRenderer.on("shell:data", (_, data) => callback(data));
        },
        onExit: (callback: (code: number) => void) => {
            ipcRenderer.on("shell:exit", (_, code) => callback(code));
        },
    },

    fs: {
        listDir: (path: string) => ipcRenderer.invoke("fs:listDir", path),
        readFile: (path: string) => ipcRenderer.invoke("fs:readFile", path),
        writeFile: (path: string, content: string) => ipcRenderer.invoke("fs:writeFile", path, content),
        exists: (path: string) => ipcRenderer.invoke("fs:exists", path),
        // Write operations
        createDir: (path: string) => ipcRenderer.invoke("fs:createDir", path),
        createFile: (path: string, content?: string) =>
            ipcRenderer.invoke("fs:createFile", path, content),
        deleteFile: (path: string) => ipcRenderer.invoke("fs:deleteFile", path),
        deleteDir: (path: string) => ipcRenderer.invoke("fs:deleteDir", path),
        rename: (oldPath: string, newPath: string) =>
            ipcRenderer.invoke("fs:rename", oldPath, newPath),
        copyFile: (sourcePath: string, destPath: string) =>
            ipcRenderer.invoke("fs:copyFile", sourcePath, destPath),
    },

    // Git operations
    git: {
        log: (path: string, limit?: number) =>
            ipcRenderer.invoke("git:log", path, limit),
        status: (path: string) => ipcRenderer.invoke("git:status", path),
        branches: (path: string) => ipcRenderer.invoke("git:branches", path),
        isRepo: (path: string) => ipcRenderer.invoke("git:isRepo", path),
    },

    // Docker operations
    docker: {
        containers: (all?: boolean) => ipcRenderer.invoke("docker:containers", all),
        action: (id: string, action: string) =>
            ipcRenderer.invoke("docker:action", id, action),
        stats: () => ipcRenderer.invoke("docker:stats"),
        isAvailable: () => ipcRenderer.invoke("docker:isAvailable"),
    },

    // System operations
    system: {
        info: () => ipcRenderer.invoke("system:info"),
        processes: (limit?: number) => ipcRenderer.invoke("system:processes", limit),
    },
} as TerminusAPI);

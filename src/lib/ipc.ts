// IPC Client - typed bridge to Electron main process

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

export interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    email: string;
    date: string;
    refs: string[];
}

export interface GitStatus {
    current: string | null;
    tracking: string | null;
    files: Array<{ path: string; status: string; staged: boolean }>;
    ahead: number;
    behind: number;
}

export interface DockerContainer {
    id: string;
    name: string;
    image: string;
    state: string;
    status: string;
    ports: string;
    created: number;
}

export interface ContainerStats {
    id: string;
    name: string;
    cpuPercent: number;
    memoryUsage: string;
    memoryLimit: string;
    memoryPercent: number;
}

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

interface TerminusAPI {
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

declare global {
    interface Window {
        terminus: TerminusAPI;
    }
}

// Export typed API accessors
export const shell = window.terminus?.shell;
export const fs = window.terminus?.fs;
export const git = window.terminus?.git;
export const docker = window.terminus?.docker;
export const system = window.terminus?.system;

// Helper to check if we're in Electron
export const isElectron = () => {
    return typeof window !== "undefined" && window.terminus !== undefined;
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Preload script - exposes safe IPC bridge to renderer
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("terminus", {
    // Shell operations
    shell: {
        spawn: () => electron_1.ipcRenderer.invoke("shell:spawn"),
        write: (data) => electron_1.ipcRenderer.invoke("shell:write", data),
        resize: (cols, rows) => electron_1.ipcRenderer.invoke("shell:resize", cols, rows),
        kill: () => electron_1.ipcRenderer.invoke("shell:kill"),
        getCwd: () => electron_1.ipcRenderer.invoke("shell:getCwd"),
        onData: (callback) => {
            electron_1.ipcRenderer.on("shell:data", (_, data) => callback(data));
        },
        onExit: (callback) => {
            electron_1.ipcRenderer.on("shell:exit", (_, code) => callback(code));
        },
    },
    // Filesystem operations
    fs: {
        listDir: (path) => electron_1.ipcRenderer.invoke("fs:listDir", path),
        readFile: (path) => electron_1.ipcRenderer.invoke("fs:readFile", path),
        writeFile: (path, content) => electron_1.ipcRenderer.invoke("fs:writeFile", path, content),
        exists: (path) => electron_1.ipcRenderer.invoke("fs:exists", path),
        // Write operations
        createDir: (path) => electron_1.ipcRenderer.invoke("fs:createDir", path),
        createFile: (path, content) => electron_1.ipcRenderer.invoke("fs:createFile", path, content),
        deleteFile: (path) => electron_1.ipcRenderer.invoke("fs:deleteFile", path),
        deleteDir: (path) => electron_1.ipcRenderer.invoke("fs:deleteDir", path),
        rename: (oldPath, newPath) => electron_1.ipcRenderer.invoke("fs:rename", oldPath, newPath),
        copyFile: (sourcePath, destPath) => electron_1.ipcRenderer.invoke("fs:copyFile", sourcePath, destPath),
    },
    // Git operations
    git: {
        log: (path, limit) => electron_1.ipcRenderer.invoke("git:log", path, limit),
        status: (path) => electron_1.ipcRenderer.invoke("git:status", path),
        branches: (path) => electron_1.ipcRenderer.invoke("git:branches", path),
        isRepo: (path) => electron_1.ipcRenderer.invoke("git:isRepo", path),
    },
    // Docker operations
    docker: {
        containers: (all) => electron_1.ipcRenderer.invoke("docker:containers", all),
        action: (id, action) => electron_1.ipcRenderer.invoke("docker:action", id, action),
        stats: () => electron_1.ipcRenderer.invoke("docker:stats"),
        isAvailable: () => electron_1.ipcRenderer.invoke("docker:isAvailable"),
    },
    // System operations
    system: {
        info: () => electron_1.ipcRenderer.invoke("system:info"),
        processes: (limit) => electron_1.ipcRenderer.invoke("system:processes", limit),
    },
});

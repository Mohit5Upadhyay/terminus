"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Electron Main Process
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const shell_1 = require("./services/shell");
const filesystem_1 = require("./services/filesystem");
const git_1 = require("./services/git");
const docker_1 = require("./services/docker");
const system_1 = require("./services/system");
let mainWindow = null;
let shellService = null;
async function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: "hiddenInset",
        backgroundColor: "#0d1117",
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // Initialize shell service
    shellService = new shell_1.ShellService(mainWindow);
    // Grant microphone/media permissions for voice dictation
    electron_1.session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        const allowedPermissions = ["media", "microphone", "audioCapture"];
        callback(allowedPermissions.includes(permission));
    });
    electron_1.session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
        const allowedPermissions = ["media", "microphone", "audioCapture"];
        return allowedPermissions.includes(permission);
    });
    // Register IPC handlers
    registerIPCHandlers();
    // Use app.isPackaged to detect production vs development
    const isDev = !electron_1.app.isPackaged;
    if (isDev) {
        // Development: load from Vite dev server
        mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    }
    else {
        // Production: load built files
        mainWindow.loadFile(path_1.default.join(__dirname, "../dist/index.html"));
    }
    mainWindow.on("closed", () => {
        mainWindow = null;
        shellService?.kill();
    });
}
function registerIPCHandlers() {
    // Shell commands
    electron_1.ipcMain.handle("shell:spawn", () => shellService?.spawn());
    electron_1.ipcMain.handle("shell:write", (_, data) => shellService?.write(data));
    electron_1.ipcMain.handle("shell:resize", (_, cols, rows) => shellService?.resize(cols, rows));
    electron_1.ipcMain.handle("shell:kill", () => shellService?.kill());
    electron_1.ipcMain.handle("shell:getCwd", () => shellService?.getCwd());
    // Filesystem commands
    electron_1.ipcMain.handle("fs:listDir", async (_, dirPath) => {
        return filesystem_1.FilesystemService.listDirectory(dirPath);
    });
    electron_1.ipcMain.handle("fs:readFile", async (_, filePath) => {
        return filesystem_1.FilesystemService.readFile(filePath);
    });
    electron_1.ipcMain.handle("fs:writeFile", async (_, filePath, content) => {
        return filesystem_1.FilesystemService.writeFile(filePath, content);
    });
    electron_1.ipcMain.handle("fs:exists", async (_, filePath) => {
        return filesystem_1.FilesystemService.exists(filePath);
    });
    // Filesystem write operations (require user confirmation in renderer)
    electron_1.ipcMain.handle("fs:createDir", async (_, dirPath) => {
        return filesystem_1.FilesystemService.createDirectory(dirPath);
    });
    electron_1.ipcMain.handle("fs:createFile", async (_, filePath, content) => {
        return filesystem_1.FilesystemService.createFile(filePath, content);
    });
    electron_1.ipcMain.handle("fs:deleteFile", async (_, filePath) => {
        return filesystem_1.FilesystemService.deleteFile(filePath);
    });
    electron_1.ipcMain.handle("fs:deleteDir", async (_, dirPath) => {
        return filesystem_1.FilesystemService.deleteDirectory(dirPath);
    });
    electron_1.ipcMain.handle("fs:rename", async (_, oldPath, newPath) => {
        return filesystem_1.FilesystemService.rename(oldPath, newPath);
    });
    electron_1.ipcMain.handle("fs:copyFile", async (_, sourcePath, destPath) => {
        return filesystem_1.FilesystemService.copyFile(sourcePath, destPath);
    });
    // Git commands
    electron_1.ipcMain.handle("git:log", async (_, repoPath, limit) => {
        return git_1.GitService.getLog(repoPath, limit);
    });
    electron_1.ipcMain.handle("git:status", async (_, repoPath) => {
        return git_1.GitService.getStatus(repoPath);
    });
    electron_1.ipcMain.handle("git:branches", async (_, repoPath) => {
        return git_1.GitService.getBranches(repoPath);
    });
    electron_1.ipcMain.handle("git:isRepo", async (_, dirPath) => {
        return git_1.GitService.isGitRepo(dirPath);
    });
    // Docker commands
    electron_1.ipcMain.handle("docker:containers", async (_, all) => {
        return docker_1.DockerService.listContainers(all);
    });
    electron_1.ipcMain.handle("docker:action", async (_, id, action) => {
        return docker_1.DockerService.containerAction(id, action);
    });
    electron_1.ipcMain.handle("docker:stats", async () => {
        return docker_1.DockerService.getStats();
    });
    electron_1.ipcMain.handle("docker:isAvailable", async () => {
        return docker_1.DockerService.isAvailable();
    });
    // System commands
    electron_1.ipcMain.handle("system:info", async () => {
        return system_1.SystemService.getInfo();
    });
    electron_1.ipcMain.handle("system:processes", async (_, limit) => {
        return system_1.SystemService.getProcesses(limit);
    });
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on("window-all-closed", () => {
    shellService?.kill();
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

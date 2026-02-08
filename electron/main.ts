// Electron Main Process
import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import { ShellService } from "./services/shell";
import { FilesystemService } from "./services/filesystem";
import { GitService } from "./services/git";
import { DockerService } from "./services/docker";
import { SystemService } from "./services/system";

let mainWindow: BrowserWindow | null = null;
let shellService: ShellService | null = null;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: "hiddenInset",
        backgroundColor: "#0d1117",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Initialize shell service
    shellService = new ShellService(mainWindow);

    // Grant microphone/media permissions for voice dictation
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
        const allowedPermissions = ["media", "microphone", "audioCapture"];
        callback(allowedPermissions.includes(permission));
    });

    session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
        const allowedPermissions = ["media", "microphone", "audioCapture"];
        return allowedPermissions.includes(permission);
    });

    registerIPCHandlers();

    const isDev = !app.isPackaged;

    if (isDev) {
        // Development: load from Vite dev server
        mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    } else {
        // Production: load built files
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
        shellService?.kill();
    });
}

function registerIPCHandlers() {
    // Shell commands
    ipcMain.handle("shell:spawn", () => shellService?.spawn());
    ipcMain.handle("shell:write", (_, data: string) => shellService?.write(data));
    ipcMain.handle("shell:resize", (_, cols: number, rows: number) =>
        shellService?.resize(cols, rows)
    );
    ipcMain.handle("shell:kill", () => shellService?.kill());
    ipcMain.handle("shell:getCwd", () => shellService?.getCwd());

    // Filesystem commands
    ipcMain.handle("fs:listDir", async (_, dirPath: string) => {
        return FilesystemService.listDirectory(dirPath);
    });
    ipcMain.handle("fs:readFile", async (_, filePath: string) => {
        return FilesystemService.readFile(filePath);
    });
    ipcMain.handle("fs:writeFile", async (_, filePath: string, content: string) => {
        return FilesystemService.writeFile(filePath, content);
    });
    ipcMain.handle("fs:exists", async (_, filePath: string) => {
        return FilesystemService.exists(filePath);
    });

    // Filesystem write operations (require user confirmation in renderer)
    ipcMain.handle("fs:createDir", async (_, dirPath: string) => {
        return FilesystemService.createDirectory(dirPath);
    });
    ipcMain.handle("fs:createFile", async (_, filePath: string, content?: string) => {
        return FilesystemService.createFile(filePath, content);
    });
    ipcMain.handle("fs:deleteFile", async (_, filePath: string) => {
        return FilesystemService.deleteFile(filePath);
    });
    ipcMain.handle("fs:deleteDir", async (_, dirPath: string) => {
        return FilesystemService.deleteDirectory(dirPath);
    });
    ipcMain.handle("fs:rename", async (_, oldPath: string, newPath: string) => {
        return FilesystemService.rename(oldPath, newPath);
    });
    ipcMain.handle("fs:copyFile", async (_, sourcePath: string, destPath: string) => {
        return FilesystemService.copyFile(sourcePath, destPath);
    });

    // Git commands
    ipcMain.handle("git:log", async (_, repoPath: string, limit?: number) => {
        return GitService.getLog(repoPath, limit);
    });
    ipcMain.handle("git:status", async (_, repoPath: string) => {
        return GitService.getStatus(repoPath);
    });
    ipcMain.handle("git:branches", async (_, repoPath: string) => {
        return GitService.getBranches(repoPath);
    });
    ipcMain.handle("git:isRepo", async (_, dirPath: string) => {
        return GitService.isGitRepo(dirPath);
    });

    // Docker commands
    ipcMain.handle("docker:containers", async (_, all?: boolean) => {
        return DockerService.listContainers(all);
    });
    ipcMain.handle("docker:action", async (_, id: string, action: string) => {
        return DockerService.containerAction(id, action as any);
    });
    ipcMain.handle("docker:stats", async () => {
        return DockerService.getStats();
    });
    ipcMain.handle("docker:isAvailable", async () => {
        return DockerService.isAvailable();
    });

    // System commands
    ipcMain.handle("system:info", async () => {
        return SystemService.getInfo();
    });
    ipcMain.handle("system:processes", async (_, limit?: number) => {
        return SystemService.getProcesses(limit);
    });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    shellService?.kill();
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

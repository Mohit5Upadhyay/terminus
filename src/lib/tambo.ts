/**
 * @file tambo.ts
 * @description Tambo SDK configuration for Terminus Generative Terminal components
 *
 */

import { z } from "zod";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { FileGrid } from "@/components/genui/FileGrid";
import { GitNetwork } from "@/components/genui/GitNetwork";
import { ContainerDash } from "@/components/genui/ContainerDash";
import { SystemMonitor } from "@/components/genui/SystemMonitor";
import { JsonExplorer } from "@/components/genui/JsonExplorer";
import { PackageInfo } from "@/components/genui/PackageInfo";
import { FileViewer } from "@/components/genui/FileViewer";
import { fs, git, docker, system, shell } from "@/lib/ipc";

/**
 * FileGrid Schema - for ls/dir command visualization
 */
export const fileGridSchema = z.object({
    path: z.string().optional().describe("The absolute path being listed (defaults to CWD)"),
    files: z.array(
        z.object({
            name: z.string().describe("Name of the file or directory"),
            path: z.string().describe("Full path to the item"),
            isDirectory: z.boolean().describe("Whether this is a directory"),
            size: z.number().describe("Size in bytes (0 for directories)"),
            modified: z.string().describe("ISO date string of last modification"),
            extension: z.string().nullable().describe("File extension without dot, null for directories"),
            permissions: z.string().describe("Unix permission string like '755'"),
            isHidden: z.boolean().describe("Whether the file starts with a dot"),
        })
    ).optional().describe("Array of file entries to display (optional, will be fetched if missing)"),
});

/**
 * GitNetwork Schema - for git log visualization
 */
export const gitNetworkSchema = z.object({
    path: z.string().optional().describe("Path to the git repository"),
    commits: z.array(
        z.object({
            hash: z.string().describe("Full commit hash"),
            shortHash: z.string().describe("Abbreviated 7-char hash"),
            message: z.string().describe("Commit message"),
            author: z.string().describe("Author name"),
            email: z.string().describe("Author email"),
            date: z.string().describe("ISO date string"),
            refs: z.array(z.string()).describe("Branch/tag refs like 'HEAD -> main'"),
        })
    ).optional().describe("Array of git commits (optional, will be fetched if missing)"),
    branch: z.string().nullable().optional().describe("Current branch name"),
});

/**
 * ContainerDash Schema - for docker ps visualization
 */
export const containerDashSchema = z.object({
    containers: z.array(
        z.object({
            id: z.string().describe("Container ID (12 char)"),
            name: z.string().describe("Container name"),
            image: z.string().describe("Image name with tag"),
            state: z.enum(["running", "exited", "paused", "restarting", "created"])
                .describe("Container state"),
            status: z.string().describe("Status string like 'Up 2 hours'"),
            ports: z.string().describe("Port mappings like '80->8080/tcp'"),
            created: z.number().describe("Unix timestamp of creation"),
        })
    ).optional().describe("Array of Docker containers (optional, will be fetched if missing)"),
});

/**
 * SystemMonitor Schema - for top/htop visualization
 */
export const systemMonitorSchema = z.object({
    info: z.object({
        cpuUsage: z.number().describe("CPU usage percentage 0-100"),
        memoryTotal: z.number().describe("Total memory in bytes"),
        memoryUsed: z.number().describe("Used memory in bytes"),
        memoryPercent: z.number().describe("Memory usage percentage 0-100"),
        uptime: z.number().describe("System uptime in seconds"),
        hostname: z.string().describe("System hostname"),
        platform: z.string().describe("OS platform like 'darwin'"),
        osVersion: z.string().describe("OS version string"),
        cpuModel: z.string().describe("CPU model name"),
        cpuCores: z.number().describe("Number of CPU cores"),
    }).optional().describe("System information (optional, will be fetched if missing)"),
    processes: z.array(
        z.object({
            pid: z.number().describe("Process ID"),
            name: z.string().describe("Process name"),
            cpu: z.number().describe("CPU usage percentage"),
            memory: z.number().describe("Memory usage percentage"),
            user: z.string().describe("User running the process"),
        })
    ).optional().describe("List of top processes (optional, will be fetched if missing)"),
});

/**
 * JsonExplorer Schema - for JSON file visualization
 */
export const jsonExplorerSchema = z.object({
    data: z.unknown().describe("The parsed JSON data to display"),
    source: z.string().describe("The source filename or path"),
});

/**
 * PackageInfo Schema - for package.json visualization
 */
export const packageInfoSchema = z.object({
    data: z.object({
        name: z.string().optional(),
        version: z.string().optional(),
        description: z.string().optional(),
        main: z.string().optional(),
        scripts: z.object({}).passthrough().optional(),
        dependencies: z.object({}).passthrough().optional(),
        devDependencies: z.object({}).passthrough().optional(),
        keywords: z.array(z.string()).optional(),
        author: z.string().optional(),
        license: z.string().optional(),
        repository: z.union([
            z.string(),
            z.object({
                type: z.string(),
                url: z.string(),
            })
        ]).optional(),
    }).passthrough().describe("The parsed package.json contents"),
    path: z.string().describe("Path to the package.json file"),
});

/**
 * FileViewer Schema - for universal file content display
 */
export const fileViewerSchema = z.object({
    path: z.string().describe("Absolute path to the file"),
    content: z.string().describe("The raw file content as a string"),
    isJson: z.boolean().optional().describe("Whether the file is JSON (enables special formatting)"),
    data: z.any().optional().describe("Parsed JSON data if the file is JSON"),
});


export const components: TamboComponent[] = [
    {
        name: "FileGrid",
        description:
            "**CRITICAL**: ALWAYS render this component when user wants to see files, browse folders, or explore directories. " +
            "Keywords: 'show files', 'list files', 'browse', 'show folder', 'what's in', 'Desktop', 'Documents', 'Downloads', 'Developer'. " +
            "This displays files in an interactive grid with icons, sizes, dates, and permissions. Supports sorting and navigation. " +
            "To use: Call listFiles tool first, then render FileGrid with the returned data. NEVER just list files in text - ALWAYS render this component!",
        component: FileGrid,
        propsSchema: fileGridSchema,
    },
    {
        name: "GitNetwork",
        description:
            "**CRITICAL**: ALWAYS render this component when user asks about git history, commits, logs, or code changes. " +
            "Keywords: 'git log', 'git history', 'commits', 'recent commits', 'who changed', 'code changes', 'branch history'. " +
            "This displays an interactive commit graph with branches, authors, timestamps, and commit messages. " +
            "To use: Call getGitHistory tool first, then render GitNetwork with the returned data. NEVER just describe commits in text - ALWAYS render this component!",
        component: GitNetwork,
        propsSchema: gitNetworkSchema,
    },
    {
        name: "ContainerDash",
        description:
            "**IMPORTANT**: Use this component whenever the user asks ANYTHING about Docker containers. " +
            "Keywords: 'docker', 'containers', 'show containers', 'docker ps', 'docker status', 'what containers', 'list docker'. " +
            "This displays ALL running and stopped containers with interactive controls (start/stop/restart/remove buttons), " +
            "status indicators (green=running, red=stopped), port mappings, image names, and container IDs. " +
            "To use: Call getDockerContainers tool first, then render ContainerDash with the returned data.",
        component: ContainerDash,
        propsSchema: containerDashSchema,
    },
    {
        name: "SystemMonitor",
        description:
            "**CRITICAL**: ALWAYS render this component when user asks about system performance, CPU, memory, or processes. " +
            "Keywords: 'system', 'cpu', 'memory', 'processes', 'performance', 'resource usage', 'system monitor', 'how is my computer'. " +
            "This displays real-time CPU/memory gauges, system uptime, hostname, and top processes list. " +
            "To use: Call getSystemInfo tool first, then render SystemMonitor with the returned data. NEVER just describe system info in text - ALWAYS render this component!",
        component: SystemMonitor,
        propsSchema: systemMonitorSchema,
    },
    {
        name: "JsonExplorer",
        description:
            "**CRITICAL - YOU MUST RENDER THIS COMPONENT**: When user asks to open/view/show ANY .json file (except package.json), YOU MUST render this JsonExplorer component. " +
            "DO NOT just say 'I opened the file' or describe it - YOU MUST ACTUALLY RENDER THE COMPONENT. " +
            "Keywords: 'open json', 'show json', 'view config', 'tsconfig.json', 'settings.json', any '.json' file. " +
            "REQUIRED STEPS: 1) Call readFile tool with the path, 2) Take the 'data' field from response, 3) RENDER JsonExplorer component with that data. " +
            "Example: User says 'open tsconfig.json' → You call readFile → You get back {data: {...}, path: '...'} → YOU MUST RENDER: <JsonExplorer data={data} source={path} />. " +
            "This component shows JSON in an interactive tree view with syntax highlighting and copy functionality.",
        component: JsonExplorer,
        propsSchema: jsonExplorerSchema,
    },
    {
        name: "PackageInfo",
        description:
            "**CRITICAL - YOU MUST RENDER THIS COMPONENT**: When user asks to open/view/show package.json, YOU MUST render this PackageInfo component. " +
            "DO NOT just say 'I opened package.json' or list the contents - YOU MUST ACTUALLY RENDER THE COMPONENT. " +
            "Keywords: 'package.json', 'open package.json', 'show package.json', 'view package.json', 'show dependencies', 'npm scripts'. " +
            "REQUIRED STEPS: 1) Call readFile tool with package.json path, 2) Take the 'data' field from response, 3) RENDER PackageInfo component with that data. " +
            "Example: User says 'open package.json' → You call readFile → You get back {data: {...}, path: '...'} → YOU MUST RENDER: <PackageInfo data={data} path={path} />. " +
            "This component displays package.json beautifully with scripts, dependencies, and metadata.",
        component: PackageInfo,
        propsSchema: packageInfoSchema,
    },
    {
        name: "FileViewer",
        description:
            "**Universal file content viewer** - Use when user wants to view ANY type of file. " +
            "Supports: JSON, TypeScript, JavaScript, Python, CSS, HTML, Markdown, text files, config files, etc. " +
            "Keywords: 'open file', 'view file', 'show file', 'read file', 'cat file', any file viewing request. " +
            "This displays file contents with syntax highlighting, line numbers, copy functionality, and file info. " +
            "To use: Call readFile tool first, then render FileViewer with ALL the returned data (path, content, is Json, data). " +
            "ALWAYS render this component - NEVER just paste file contents as plain text!",
        component: FileViewer,
        propsSchema: fileViewerSchema,
    },
];

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * are controlled by AI to dynamically fetch data based on user interactions.
 * 
 * Tools enable Tambo AI to fetch real data from the terminal environment when users ask questions.
 */

export const tools: TamboTool[] = [
    {
        name: "listFiles",
        description:
            "**CRITICAL**: Call this tool when user asks to see files in ANY directory. " +
            "Keywords: 'show files', 'list files', 'what's in folder', 'Desktop files', 'Documents', 'Downloads', 'Developer folder'. " +
            "This fetches file/folder listings with names, sizes, dates, and permissions. " +
            "After calling this, ALWAYS render FileGrid component with the returned data - NEVER just list files in text! " +
            "Use getCurrentDirectory tool first if user mentions relative paths like 'my projects' or 'Developer folder'.",
        tool: async ({ path }: { path?: string }) => {
            try {
                let targetPath: string;

                if (path) {
                    const isValidPath = path.startsWith('/Users/') ||
                        path.startsWith('/Applications/') ||
                        path.startsWith('/Library/') ||
                        path.startsWith('/System/') ||
                        path.startsWith('/var/') ||
                        path.startsWith('/tmp/') ||
                        path.startsWith('/Volumes/') ||
                        path === '/';

                    if (!isValidPath) {
                        const cwd = await shell.getCwd();
                        targetPath = path.startsWith('/') ? path : `${cwd}/${path}`;
                    } else {
                        targetPath = path;
                    }

                    const exists = await fs.exists(targetPath);
                    if (!exists) {
                        throw new Error(`Path does not exist: ${targetPath}. Please provide a valid absolute path.`);
                    }
                } else {
                    targetPath = await shell.getCwd();
                }

                const files = await fs.listDir(targetPath);
                return { path: targetPath, files };
            } catch (error) {
                throw new Error(`Failed to list files: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                path: z.string().optional().describe("Directory path to list. Must be a valid absolute macOS path (e.g., /Users/username/Documents). If not provided, uses current working directory."),
            }).default({})
        ),
    },
    {
        name: "getGitHistory",
        description:
            "**CRITICAL**: Call this tool when user asks about git history, commits, or code changes. " +
            "Keywords: 'git log', 'commits', 'git history', 'recent commits', 'who changed', 'branch history', 'show commits'. " +
            "This fetches commit history with authors, dates, messages, and branch info. " +
            "After calling this, ALWAYS render GitNetwork component with the returned data - NEVER just describe commits in text!",
        tool: async ({ path, limit }: { path?: string; limit?: number }) => {
            try {
                const repoPath = path || (await shell.getCwd());
                const isRepo = await git.isRepo(repoPath);

                if (!isRepo) {
                    throw new Error("Not a git repository");
                }

                const commits = await git.log(repoPath, limit || 30);
                const status = await git.status(repoPath);

                return {
                    path: repoPath,
                    commits,
                    branch: status.current
                };
            } catch (error) {
                throw new Error(`Failed to get git history: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                path: z.string().optional().describe("Path to the git repository. Defaults to current directory."),
                limit: z.number().optional().describe("Maximum number of commits to fetch. Defaults to 30."),
            }).default({})
        ),
    },
    {
        name: "getDockerContainers",
        description:
            "**CRITICAL**: ALWAYS call this tool when the user asks ANYTHING about Docker or containers. " +
            "Keywords: 'docker', 'containers', 'show containers', 'docker ps', 'docker status', 'what containers', 'list docker'. " +
            "This fetches ALL Docker containers (running and stopped) with their status, names, images, ports, and IDs. " +
            "After calling this, ALWAYS render the ContainerDash component with the returned data - NEVER just describe the containers in text. " +
            "Set 'all' parameter to true to include stopped containers (recommended).",
        tool: async ({ all }: { all?: boolean }) => {
            try {
                const isAvailable = await docker.isAvailable();

                if (!isAvailable) {
                    throw new Error("Docker is not running or not available");
                }

                const containers = await docker.containers(all !== false); // Default to true (show all)

                return { containers };
            } catch (error) {
                throw new Error(`Failed to get Docker containers: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                all: z.boolean().optional().describe("Include stopped containers. Defaults to true (show all containers)."),
            }).default({ all: true })
        ),
    },
    {
        name: "getSystemInfo",
        description:
            "**CRITICAL**: Call this tool when user asks about system performance, CPU, memory, or processes. " +
            "Keywords: 'system', 'cpu', 'memory', 'processes', 'performance', 'how is my computer', 'activity monitor', 'resource usage'. " +
            "This fetches CPU usage, memory usage, running processes, uptime, and system details. " +
            "After calling this, ALWAYS render SystemMonitor component with the returned data - NEVER just describe system stats in text!",
        tool: async ({ processLimit }: { processLimit?: number }) => {
            try {
                const info = await system.info();
                const processes = await system.processes(processLimit || 10);

                return { info, processes };
            } catch (error) {
                throw new Error(`Failed to get system info: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                processLimit: z.number().optional().describe("Maximum number of top processes to return. Defaults to 10."),
            }).default({})
        ),
    },
    {
        name: "readFile",
        description:
            "**CRITICAL**: Call this tool when user wants to open, view, or read ANY file. " +
            "Keywords: 'open file', 'show file', 'view file', 'read file', 'open package.json', 'open tsconfig.json', 'show config'. " +
            "" +
            "MANDATORY RENDERING RULES - YOU MUST FOLLOW THESE AFTER CALLING THIS TOOL: " +
            "" +
            "1. For package.json files: " +
            "   - DO NOT say 'Opened package.json' or describe it in text " +
            "   - YOU MUST RENDER: <PackageInfo data={response.data} path={response.path} /> " +
            "   - The user expects to SEE the visual component, not read text " +
            "" +
            "2. For other .json files (tsconfig.json, settings.json, etc.): " +
            "   - DO NOT say 'Opened file' or describe it in text " +
            "   - YOU MUST RENDER: <JsonExplorer data={response.data} source={response.path} /> " +
            "   - The user expects to SEE the visual component, not read text " +
            "" +
            "3. For non-JSON files: Display content appropriately (code blocks, etc.) " +
            "" +
            "REMINDER: After this tool returns data, your NEXT action must be rendering the component, NOT describing what you did!",
        tool: async ({ path }: { path: string }) => {
            try {
                const exists = await fs.exists(path);

                if (!exists) {
                    throw new Error(`File not found: ${path}`);
                }

                const content = await fs.readFile(path);

                // Try to parse as JSON if it's a .json file
                if (path.endsWith('.json')) {
                    try {
                        const data = JSON.parse(content);
                        return {
                            path,
                            content,
                            data,
                            isJson: true
                        };
                    } catch {
                        // Not valid JSON, return as text
                        return { path, content, isJson: false };
                    }
                }

                return { path, content, isJson: false };
            } catch (error) {
                throw new Error(`Failed to read file: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                path: z.string().describe("Absolute path to the file to read."),
            })
        ),
    },
    {
        name: "getCurrentDirectory",
        description:
            "Get the current working directory path. " +
            "Use this FIRST when users ask about relative locations like 'Developer folder', 'my projects', 'Desktop', etc. " +
            "This helps you discover the user's home directory so you can construct proper absolute paths for other tools. " +
            "For example, if user says 'show me Developer folder', call this first to get /Users/username, then use /Users/username/Developer for listFiles.",
        tool: async () => {
            try {
                const cwd = await shell.getCwd();
                const homeDir = cwd.match(/^(\/Users\/[^\/]+)/)?.[1] || cwd;
                return {
                    cwd,
                    homeDir,
                    suggestedPaths: {
                        desktop: `${homeDir}/Desktop`,
                        documents: `${homeDir}/Documents`,
                        downloads: `${homeDir}/Downloads`,
                        developer: `${homeDir}/Developer`,
                    }
                };
            } catch (error) {
                throw new Error(`Failed to get current directory: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(z.object({}).default({})),
    },
    {
        name: "createFolder",
        description:
            "Create a new folder/directory at the specified path. " +
            "Use this when users want to organize files, create project folders, or set up directory structures. " +
            "Executes directly with safety checks: validates path doesn't already exist.",
        tool: async ({ path, folderName }: { path: string; folderName: string }) => {
            const fullPath = `${path}/${folderName}`.replace(/\/+/g, '/');

            const exists = await fs.exists(fullPath);
            if (exists) {
                throw new Error(`Folder already exists: ${fullPath}`);
            }

            try {
                await fs.createDir(fullPath);
                return {
                    success: true,
                    operation: "createFolder",
                    path: fullPath,
                    message: `Successfully created folder: ${fullPath}`,
                };
            } catch (error) {
                throw new Error(`Failed to create folder: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                path: z.string().describe("Absolute path to the parent directory where the folder should be created."),
                folderName: z.string().describe("Name of the new folder to create."),
            })
        ),
    },
    {
        name: "createFile",
        description:
            "Create a new file with optional content at the specified path. " +
            "Use this when users want to create new text files, config files, or write data to disk. " +
            "Executes directly with safety checks: validates file doesn't already exist.",
        tool: async ({ path, fileName, content }: { path: string; fileName: string; content?: string }) => {
            const fullPath = `${path}/${fileName}`.replace(/\/+/g, '/');

            const exists = await fs.exists(fullPath);
            if (exists) {
                throw new Error(`File already exists: ${fullPath}`);
            }

            try {
                await fs.createFile(fullPath, content || "");
                return {
                    success: true,
                    operation: "createFile",
                    path: fullPath,
                    contentLength: (content || "").length,
                    message: `Successfully created file: ${fullPath}${content ? ` (${content.length} bytes)` : ""}`,
                };
            } catch (error) {
                throw new Error(`Failed to create file: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                path: z.string().describe("Absolute path to the directory where the file should be created."),
                fileName: z.string().describe("Name of the new file to create (including extension)."),
                content: z.string().optional().describe("Optional text content to write to the file."),
            })
        ),
    },
    {
        name: "deleteItem",
        description:
            "Delete a file or empty folder at the specified path. " +
            "Use this when users want to remove files or clean up directories. " +
            "Executes directly with safety checks: validates item exists, cannot delete non-empty directories.",
        tool: async ({ path }: { path: string }) => {
            const exists = await fs.exists(path);
            if (!exists) {
                throw new Error(`Item not found: ${path}`);
            }

            try {
                const items = await fs.listDir(path);
                const isDirectory = items.length >= 0; 

                if (isDirectory) {
                    if (items.length > 0) {
                        throw new Error(`Cannot delete non-empty directory: ${path} (contains ${items.length} items)`);
                    }
                    await fs.deleteDir(path);
                    return {
                        success: true,
                        operation: "deleteFolder",
                        path,
                        message: `Successfully deleted empty folder: ${path}`,
                    };
                } else {
                    await fs.deleteFile(path);
                    return {
                        success: true,
                        operation: "deleteFile",
                        path,
                        message: `Successfully deleted file: ${path}`,
                    };
                }
            } catch (error) {
                
                if ((error as Error).message.includes("ENOTDIR") || (error as Error).message.includes("not a directory")) {
                    await fs.deleteFile(path);
                    return {
                        success: true,
                        operation: "deleteFile",
                        path,
                        message: `Successfully deleted file: ${path}`,
                    };
                }
                throw new Error(`Failed to delete item: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                path: z.string().describe("Absolute path to the file or empty folder to delete."),
            })
        ),
    },
    {
        name: "renameItem",
        description:
            "Rename or move a file or folder to a new path. " +
            "Use this when users want to rename files/folders or move items to different directories. " +
            "Executes directly with safety checks: validates source exists and destination doesn't exist.",
        tool: async ({ oldPath, newPath }: { oldPath: string; newPath: string }) => {
            // Check if source exists
            const exists = await fs.exists(oldPath);
            if (!exists) {
                throw new Error(`Source item not found: ${oldPath}`);
            }

            // Check if destination exists
            const destExists = await fs.exists(newPath);
            if (destExists) {
                throw new Error(`Destination already exists: ${newPath}`);
            }

            // Execute the operation
            try {
                await fs.rename(oldPath, newPath);
                return {
                    success: true,
                    operation: "rename",
                    oldPath,
                    newPath,
                    message: `Successfully renamed/moved: ${oldPath} → ${newPath}`,
                };
            } catch (error) {
                throw new Error(`Failed to rename item: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                oldPath: z.string().describe("Absolute path to the current file or folder."),
                newPath: z.string().describe("Absolute path for the new name/location."),
            })
        ),
    },
    {
        name: "copyFile",
        description:
            "Copy a file to a new location. " +
            "Use this when users want to duplicate files or create backups. " +
            "Executes directly with safety checks: validates source exists, destination doesn't exist. Only works for files, not folders.",
        tool: async ({ sourcePath, destPath }: { sourcePath: string; destPath: string }) => {
            // Check if source exists
            const exists = await fs.exists(sourcePath);
            if (!exists) {
                throw new Error(`Source file not found: ${sourcePath}`);
            }

            // Check if destination exists
            const destExists = await fs.exists(destPath);
            if (destExists) {
                throw new Error(`Destination already exists: ${destPath}`);
            }

            // Execute the operation
            try {
                await fs.copyFile(sourcePath, destPath);
                return {
                    success: true,
                    operation: "copyFile",
                    sourcePath,
                    destPath,
                    message: `Successfully copied: ${sourcePath} → ${destPath}`,
                };
            } catch (error) {
                throw new Error(`Failed to copy file: ${(error as Error).message}`);
            }
        },
        toolSchema: z.function().args(
            z.object({
                sourcePath: z.string().describe("Absolute path to the file to copy."),
                destPath: z.string().describe("Absolute path for the copied file."),
            })
        ),
    },
];

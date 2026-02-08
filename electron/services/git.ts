// Git Service - real git operations using simple-git
import simpleGit, { SimpleGit, LogResult, StatusResult } from "simple-git";
import path from "path";
import { existsSync } from "fs";

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

export class GitService {
    static async isGitRepo(dirPath: string): Promise<boolean> {
        const gitDir = path.join(dirPath, ".git");
        if (!existsSync(gitDir)) {
            return false;
        }
        try {
            const git: SimpleGit = simpleGit(dirPath);
            await git.status();
            return true;
        } catch {
            return false;
        }
    }

    static async getLog(repoPath: string, limit: number = 50): Promise<GitCommit[]> {
        const git: SimpleGit = simpleGit(repoPath);

        try {
            const log: LogResult = await git.log({ maxCount: limit });

            return log.all.map((commit) => ({
                hash: commit.hash,
                shortHash: commit.hash.substring(0, 7),
                message: commit.message,
                author: commit.author_name,
                email: commit.author_email,
                date: commit.date,
                refs: commit.refs ? commit.refs.split(", ").filter(Boolean) : [],
            }));
        } catch (error) {
            throw new Error(`Failed to get git log: ${(error as Error).message}`);
        }
    }

    static async getStatus(repoPath: string): Promise<GitStatus> {
        const git: SimpleGit = simpleGit(repoPath);

        try {
            const status: StatusResult = await git.status();

            return {
                current: status.current,
                tracking: status.tracking,
                files: status.files.map((f) => ({
                    path: f.path,
                    status: this.getStatusLabel(f.working_dir, f.index),
                    staged: f.index !== " " && f.index !== "?",
                })),
                ahead: status.ahead,
                behind: status.behind,
            };
        } catch (error) {
            throw new Error(`Failed to get git status: ${(error as Error).message}`);
        }
    }

    static async getBranches(repoPath: string): Promise<string[]> {
        const git: SimpleGit = simpleGit(repoPath);

        try {
            const branches = await git.branchLocal();
            return branches.all;
        } catch (error) {
            throw new Error(`Failed to get branches: ${(error as Error).message}`);
        }
    }

    static async getCurrentBranch(repoPath: string): Promise<string | null> {
        const git: SimpleGit = simpleGit(repoPath);

        try {
            const status = await git.status();
            return status.current;
        } catch {
            return null;
        }
    }

    private static getStatusLabel(workingDir: string, index: string): string {
        if (index === "?" || workingDir === "?") return "untracked";
        if (index === "A") return "added";
        if (index === "M" || workingDir === "M") return "modified";
        if (index === "D" || workingDir === "D") return "deleted";
        if (index === "R") return "renamed";
        if (index === "C") return "copied";
        return "unknown";
    }
}

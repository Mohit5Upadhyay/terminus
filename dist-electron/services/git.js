"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
// Git Service - real git operations using simple-git
const simple_git_1 = __importDefault(require("simple-git"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
class GitService {
    static async isGitRepo(dirPath) {
        const gitDir = path_1.default.join(dirPath, ".git");
        if (!(0, fs_1.existsSync)(gitDir)) {
            return false;
        }
        try {
            const git = (0, simple_git_1.default)(dirPath);
            await git.status();
            return true;
        }
        catch {
            return false;
        }
    }
    static async getLog(repoPath, limit = 50) {
        const git = (0, simple_git_1.default)(repoPath);
        try {
            const log = await git.log({ maxCount: limit });
            return log.all.map((commit) => ({
                hash: commit.hash,
                shortHash: commit.hash.substring(0, 7),
                message: commit.message,
                author: commit.author_name,
                email: commit.author_email,
                date: commit.date,
                refs: commit.refs ? commit.refs.split(", ").filter(Boolean) : [],
            }));
        }
        catch (error) {
            throw new Error(`Failed to get git log: ${error.message}`);
        }
    }
    static async getStatus(repoPath) {
        const git = (0, simple_git_1.default)(repoPath);
        try {
            const status = await git.status();
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
        }
        catch (error) {
            throw new Error(`Failed to get git status: ${error.message}`);
        }
    }
    static async getBranches(repoPath) {
        const git = (0, simple_git_1.default)(repoPath);
        try {
            const branches = await git.branchLocal();
            return branches.all;
        }
        catch (error) {
            throw new Error(`Failed to get branches: ${error.message}`);
        }
    }
    static async getCurrentBranch(repoPath) {
        const git = (0, simple_git_1.default)(repoPath);
        try {
            const status = await git.status();
            return status.current;
        }
        catch {
            return null;
        }
    }
    static getStatusLabel(workingDir, index) {
        if (index === "?" || workingDir === "?")
            return "untracked";
        if (index === "A")
            return "added";
        if (index === "M" || workingDir === "M")
            return "modified";
        if (index === "D" || workingDir === "D")
            return "deleted";
        if (index === "R")
            return "renamed";
        if (index === "C")
            return "copied";
        return "unknown";
    }
}
exports.GitService = GitService;

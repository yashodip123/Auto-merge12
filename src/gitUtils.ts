import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export async function getGitBranches(): Promise<{ branches: string[], currentBranch: string | null }> {
    return new Promise((resolve, reject) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!workspaceFolder) {
            vscode.window.showErrorMessage("❌ No workspace folder is open. Please open a Git repository.");
            return reject(new Error("No workspace folder detected"));
        }

        console.log("🚀 Running Git command in:", workspaceFolder);

        if (!fs.existsSync(path.join(workspaceFolder, ".git"))) {
            vscode.window.showErrorMessage("❌ No Git repository found in this folder.");
            return reject(new Error("Not a Git repository"));
        }

        // Run both commands in parallel
        exec("git branch --list --format='%(refname:short)' && git rev-parse --abbrev-ref HEAD", { cwd: workspaceFolder }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage("❌ Error fetching branches. Ensure this is a valid Git repository.");
                console.error("Git Error:", stderr);
                return reject(err);
            }

            const outputLines = stdout.split("\n").map(line => line.trim()).filter(line => line);
            const branches = outputLines.slice(0, -1); // All but last line (last line is current branch)
            const currentBranch = outputLines[outputLines.length - 1];

            resolve({ branches, currentBranch });
        });
    });
}

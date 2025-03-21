import { exec } from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function getConflictedFiles(sourceBranch: string, targetBranch: string): Promise<{ file: string, current: string, incoming: string }[]> {
    return new Promise((resolve, reject) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("❌ No workspace folder found.");
            return reject([]);
        }

        exec(`git checkout ${sourceBranch} && git merge --no-commit --no-ff ${targetBranch}`, { cwd: workspaceFolder }, async (err) => {
            if (!err) {
                vscode.window.showInformationMessage("✅ Merge successful! No conflicts.");
                return resolve([]);
            }

            // If merge conflicts exist, get the conflicted files
            exec("git diff --name-only --diff-filter=U", { cwd: workspaceFolder }, async (err, stdout) => {
                if (err) {return reject([]);}

                const files = stdout.trim().split("\n").filter(file => file);
                const conflicts: any[] = [];

                for (const file of files) {
                    const filePath = path.join(workspaceFolder, file);
                    const content = fs.readFileSync(filePath, "utf-8");

                    const match = content.match(/<<<<<<< HEAD(.*?)=======(.*?)>>>>>>> .*/s);
                    if (match) {
                        conflicts.push({
                            file,
                            current: match[1].trim(),
                            incoming: match[2].trim()
                        });
                    }
                }

                resolve(conflicts);
            });
        });
    });
}

export async function applyResolvedConflicts(resolvedConflicts: { file: string, resolvedContent: string }[]) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceFolder) {return;}

  for (const conflict of resolvedConflicts) {
      const filePath = path.join(workspaceFolder, conflict.file);
      fs.writeFileSync(filePath, conflict.resolvedContent, "utf-8");
  }

  exec("git add . && git commit -m 'Resolved merge conflicts using AI'", { cwd: workspaceFolder });
}


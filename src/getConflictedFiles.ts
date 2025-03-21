import { exec } from 'child_process';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Detects merge conflicts between two branches and extracts conflict sections.
 * @param sourceBranch - The branch that is being merged into.
 * @param targetBranch - The branch to merge from.
 * @returns List of conflicted files with extracted conflict sections.
 */
export async function getConflictedFiles(sourceBranch: string, targetBranch: string): Promise<{ file: string, current: string, incoming: string }[]> {
    return new Promise((resolve, reject) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        if (!workspaceFolder) {
            vscode.window.showErrorMessage("❌ No workspace folder found. Please open a Git repository.");
            return reject([]);
        }

        console.log(`🚀 Checking out ${sourceBranch} and merging ${targetBranch}...`);

        // Step 1: Checkout Source Branch
        exec(`git checkout ${sourceBranch}`, { cwd: workspaceFolder }, (checkoutErr) => {
            if (checkoutErr) {
                vscode.window.showErrorMessage(`❌ Failed to checkout branch ${sourceBranch}.`);
                console.error("Checkout Error:", checkoutErr);
                return reject([]);
            }

            // Step 2: Attempt Merge (Without Committing)
            exec(`git merge --no-commit --no-ff ${targetBranch}`, { cwd: workspaceFolder }, async (mergeErr) => {
                if (!mergeErr) {
                    vscode.window.showInformationMessage("✅ Merge successful! No conflicts detected.");
                    return resolve([]);
                }

                // Step 3: Detect Conflicted Files
                exec("git diff --name-only --diff-filter=U", { cwd: workspaceFolder }, async (diffErr, stdout) => {
                    if (diffErr || !stdout.trim()) {
                        vscode.window.showErrorMessage("❌ No merge conflicts detected, but merge failed.");
                        return reject([]);
                    }

                    const files = stdout.trim().split("\n").filter(file => file);
                    console.log(`⚠️ Merge Conflicts Detected in ${files.length} file(s).`);

                    const conflicts: any[] = [];

                    for (const file of files) {
                        const filePath = path.join(workspaceFolder, file);
                        const content = fs.readFileSync(filePath, "utf-8");

                        // Extract conflict sections using Git markers (HEAD vs Incoming)
                        const match = content.match(/<<<<<<< HEAD(.*?)=======(.*?)>>>>>>> .*/s);
                        if (match) {
                            conflicts.push({
                                file,
                                current: match[1].trim(),
                                incoming: match[2].trim()
                            });
                        }
                    }

                    // Step 4: Abort Merge if Conflicts Exist
                    if (conflicts.length > 0) {
                        exec("git merge --abort", { cwd: workspaceFolder });
                        vscode.window.showWarningMessage(`⚠️ Merge aborted! Found ${conflicts.length} conflict(s).`);
                    }

                    resolve(conflicts);
                });
            });
        });
    });
}


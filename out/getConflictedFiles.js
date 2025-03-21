"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConflictedFiles = getConflictedFiles;
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Detects merge conflicts between two branches and extracts conflict sections.
 * @param sourceBranch - The branch that is being merged into.
 * @param targetBranch - The branch to merge from.
 * @returns List of conflicted files with extracted conflict sections.
 */
async function getConflictedFiles(sourceBranch, targetBranch) {
    return new Promise((resolve, reject) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("❌ No workspace folder found. Please open a Git repository.");
            return reject([]);
        }
        console.log(`🚀 Checking out ${sourceBranch} and merging ${targetBranch}...`);
        // Step 1: Checkout Source Branch
        (0, child_process_1.exec)(`git checkout ${sourceBranch}`, { cwd: workspaceFolder }, (checkoutErr) => {
            if (checkoutErr) {
                vscode.window.showErrorMessage(`❌ Failed to checkout branch ${sourceBranch}.`);
                console.error("Checkout Error:", checkoutErr);
                return reject([]);
            }
            // Step 2: Attempt Merge (Without Committing)
            (0, child_process_1.exec)(`git merge --no-commit --no-ff ${targetBranch}`, { cwd: workspaceFolder }, async (mergeErr) => {
                if (!mergeErr) {
                    vscode.window.showInformationMessage("✅ Merge successful! No conflicts detected.");
                    return resolve([]);
                }
                // Step 3: Detect Conflicted Files
                (0, child_process_1.exec)("git diff --name-only --diff-filter=U", { cwd: workspaceFolder }, async (diffErr, stdout) => {
                    if (diffErr || !stdout.trim()) {
                        vscode.window.showErrorMessage("❌ No merge conflicts detected, but merge failed.");
                        return reject([]);
                    }
                    const files = stdout.trim().split("\n").filter(file => file);
                    console.log(`⚠️ Merge Conflicts Detected in ${files.length} file(s).`);
                    const conflicts = [];
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
                        (0, child_process_1.exec)("git merge --abort", { cwd: workspaceFolder });
                        vscode.window.showWarningMessage(`⚠️ Merge aborted! Found ${conflicts.length} conflict(s).`);
                    }
                    resolve(conflicts);
                });
            });
        });
    });
}
//# sourceMappingURL=getConflictedFiles.js.map
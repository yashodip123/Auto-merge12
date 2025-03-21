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
exports.applyResolvedConflicts = applyResolvedConflicts;
const child_process_1 = require("child_process");
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function getConflictedFiles(sourceBranch, targetBranch) {
    return new Promise((resolve, reject) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage("❌ No workspace folder found.");
            return reject([]);
        }
        (0, child_process_1.exec)(`git checkout ${sourceBranch} && git merge --no-commit --no-ff ${targetBranch}`, { cwd: workspaceFolder }, async (err) => {
            if (!err) {
                vscode.window.showInformationMessage("✅ Merge successful! No conflicts.");
                return resolve([]);
            }
            // If merge conflicts exist, get the conflicted files
            (0, child_process_1.exec)("git diff --name-only --diff-filter=U", { cwd: workspaceFolder }, async (err, stdout) => {
                if (err) {
                    return reject([]);
                }
                const files = stdout.trim().split("\n").filter(file => file);
                const conflicts = [];
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
async function applyResolvedConflicts(resolvedConflicts) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceFolder) {
        return;
    }
    for (const conflict of resolvedConflicts) {
        const filePath = path.join(workspaceFolder, conflict.file);
        fs.writeFileSync(filePath, conflict.resolvedContent, "utf-8");
    }
    (0, child_process_1.exec)("git add . && git commit -m 'Resolved merge conflicts using AI'", { cwd: workspaceFolder });
}
//# sourceMappingURL=mergeUtils.js.map
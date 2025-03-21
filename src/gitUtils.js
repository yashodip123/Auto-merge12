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
exports.getGitBranches = getGitBranches;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function getGitBranches() {
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
        (0, child_process_1.exec)("git branch --list --format='%(refname:short)' && git rev-parse --abbrev-ref HEAD", { cwd: workspaceFolder }, (err, stdout, stderr) => {
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
//# sourceMappingURL=gitUtils.js.map
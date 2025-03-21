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
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(require("vscode"));
const gitUtils_1 = require("./gitUtils");
const getConflictedFiles_1 = require("./getConflictedFiles");
const aiResolver_1 = require("./aiResolver");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    console.log("🚀 AvaAutoMerge extension activated!");
    vscode.window.showInformationMessage("✅ AvaAutoMerge is running!");
    // Register the 'helloWorld' command
    let helloWorldCommand = vscode.commands.registerCommand("test-app.helloWorld", () => {
        console.log("👋 Hello World command triggered!");
        vscode.window.showInformationMessage("👋 Hello from AvaAutoMerge!");
    });
    // Register the 'bye' command
    let byeCommand = vscode.commands.registerCommand("test-app.bye", () => {
        console.log("👋 Bye command triggered!");
        vscode.window.showInformationMessage("👋 Bye from AvaAutoMerge!");
    });
    // Register the 'resolveConflicts' command
    let resolveConflictsCommand = vscode.commands.registerCommand("test-app.resolveConflicts", async () => {
        console.log("⚡ Resolving conflicts...");
        vscode.window.showInformationMessage("Checking and resolving merge conflicts...");
        // Call AI merge logic here in the future
    });
    context.subscriptions.push(helloWorldCommand);
    context.subscriptions.push(byeCommand);
    context.subscriptions.push(resolveConflictsCommand);
    const provider = new AvaAutoMergeSidebar();
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('avaAutoMergeView', provider));
}
class AvaAutoMergeSidebar {
    resolveWebviewView(webviewView) {
        webviewView.webview.options = { enableScripts: true };
        webviewView.webview.html = this.getWebviewContent();
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "getBranches") {
                const { branches, currentBranch } = await (0, gitUtils_1.getGitBranches)();
                webviewView.webview.postMessage({
                    command: "updateBranches",
                    branches,
                    currentBranch
                });
            }
            else if (message.command === "resolveConflicts") {
                vscode.window.showInformationMessage(`Checking conflicts from ${message.source} to ${message.target}...`);
                // Step 1: Detect merge conflicts
                const conflicts = await (0, getConflictedFiles_1.getConflictedFiles)(message.source, message.target);
                if (conflicts.length === 0) {
                    vscode.window.showInformationMessage("✅ No merge conflicts detected.");
                    return;
                }
                vscode.window.showInformationMessage(`⚡ Found ${conflicts.length} conflict(s). Sending to AI for resolution...`);
                // Step 2: Send conflicts to AI for resolution
                const resolvedConflicts = await (0, aiResolver_1.resolveMergeConflicts)(conflicts);
                console.log(resolvedConflicts);
                // Step 3: Apply AI-generated merge resolutions
                // await applyResolvedConflicts(resolvedConflicts);
                vscode.window.showInformationMessage("✅ Conflicts resolved and applied successfully!");
            }
        });
    }
    getWebviewContent() {
        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AvaAutoMerge</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                background: #f4f4f4;
                text-align: center;
            }
            h3 {
                color: #333;
                font-size: 1.5em;
            }
            .container {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                margin: auto;
            }
            label {
                display: block;
                font-weight: bold;
                margin-top: 10px;
            }
            select, button {
                width: 100%;
                padding: 10px;
                margin-top: 5px;
                border: 1px solid #ccc;
                border-radius: 5px;
            }
            button {
                background: #007acc;
                color: white;
                font-size: 1em;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.3s ease;
                margin-top: 15px;
            }
            button:hover {
                background: #005fa3;
            }
            #loading {
                display: none;
                font-size: 0.9em;
                color: #777;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h3>🚀 Ava AutoMerge</h3>

            <label for="sourceBranch">Source Branch:</label>
            <select id="sourceBranch"></select>

            <label for="targetBranch">Target Branch:</label>
            <select id="targetBranch"></select>

            <button id="resolveConflicts">Check & Resolve</button>
            <p id="loading">🔄 Loading branches...</p>
        </div>

        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('resolveConflicts').addEventListener('click', () => {
                const source = document.getElementById('sourceBranch').value;
                const target = document.getElementById('targetBranch').value;
                vscode.postMessage({ command: "resolveConflicts", source, target });
            });

            window.addEventListener('message', event => {
                if (event.data.command === "updateBranches") {
                    document.getElementById('loading').style.display = 'none';
                    const branches = event.data.branches;
                    const currentBranch = event.data.currentBranch;

                    const sourceSelect = document.getElementById('sourceBranch');
                    const targetSelect = document.getElementById('targetBranch');

                    sourceSelect.innerHTML = "";
                    targetSelect.innerHTML = "";

                    branches.forEach(branch => {
                        let optionSource = document.createElement("option");
                        let optionTarget = document.createElement("option");

                        optionSource.value = branch;
                        optionSource.textContent = branch;
                        optionTarget.value = branch;
                        optionTarget.textContent = branch;

                        if (branch === "develop") {
                            optionSource.selected = true;
                        }
                        if (branch === currentBranch) {
                            optionTarget.selected = true;
                        }

                        sourceSelect.appendChild(optionSource);
                        targetSelect.appendChild(optionTarget);
                    });
                }
            });

            vscode.postMessage({ command: "getBranches" });
            document.getElementById('loading').style.display = 'block';
        </script>
    </body>
    </html>
    `;
    }
}
function deactivate() {
    console.log("❌ AvaAutoMerge extension deactivated.");
}
//# sourceMappingURL=extension.js.map
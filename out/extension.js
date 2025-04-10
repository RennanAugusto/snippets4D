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
const uuid_1 = require("uuid"); // instale com: npm install uuid
function activate(context) {
    let disposable = vscode.commands.registerCommand("snippets4D.completeClassAtCursor", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("Nenhum editor ativo.");
            return;
        }
        const document = editor.document;
        const position = editor.selection.active;
        const classRange = findClassRange(document, position.line);
        let i = classRange.start;
        let f = classRange.end;
        while (i <= f) {
            const lineText = document.lineAt(i).text.trim();
            // Identificar propriedade Delphi
            const propMatch = lineText.match(/property\s+(\w+)\s*:\s*([^;]+?)(?:\s+read\s+(\w+))?(?:\s+write\s+(\w+))?\s*;/i);
            if (propMatch) {
                const propName = propMatch[1];
                const type = propMatch[2] || "";
                const readAccessor = propMatch[3] || "";
                const writeAccessor = propMatch[4] || "";
                const edits = [];
                let insertFieldLine = findLastFieldLineInPrivate(document, i, classRange.start);
                if (insertFieldLine === -1) {
                    insertFieldLine = ensurePrivateSection(document, i);
                }
                if (insertFieldLine !== -1) {
                    let insertText = "";
                    if ((readAccessor.startsWith("F") && !fieldExists(document, `F${propName}`, classRange.start, f, i)) ||
                        (writeAccessor.startsWith("F") && !fieldExists(document, `F${propName}`, classRange.start, f, i))) {
                        insertText += `    F${propName}: ${type};\n`;
                    }
                    const methodDeclarations = [];
                    if (readAccessor.startsWith("Get") && !methodExists(document, readAccessor, classRange.start, f, i)) {
                        methodDeclarations.push(`    function ${readAccessor}: ${type};\n`);
                        //await createImplementation(document, readAccessor, propName, type);
                    }
                    if (writeAccessor.startsWith("Set") && !methodExists(document, writeAccessor, classRange.start, f, i)) {
                        methodDeclarations.push(`    procedure ${writeAccessor}(const Value: ${type});\n`);
                        //await createImplementation(document, writeAccessor, propName, type, true);
                    }
                    const edit = new vscode.WorkspaceEdit();
                    if (insertText) {
                        edit.insert(document.uri, new vscode.Position(insertFieldLine + 1, 0), insertText);
                        f += 1;
                    }
                    if (methodDeclarations.length > 0) {
                        edit.insert(document.uri, new vscode.Position(insertFieldLine + 1, 0), methodDeclarations.join(""));
                        f += methodDeclarations.length;
                    }
                    await vscode.workspace.applyEdit(edit);
                    for (let j = 0; j < methodDeclarations.length; j++) {
                        await methodImplements(methodDeclarations[j].trim(), document, i, editor);
                    }
                }
            }
            await methodImplements(lineText.trim(), document, i, editor);
            i += 1;
        }
    });
    let guidCommand = vscode.commands.registerCommand('snippets4D.generateGuid', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("Nenhum editor ativo.");
            return;
        }
        const guid = (0, uuid_1.v4)().toUpperCase();
        const formatted = `['{${guid}}']`;
        editor.edit(editBuilder => {
            const position = editor.selection.active;
            editBuilder.insert(position, formatted);
        });
    });
    context.subscriptions.push(disposable);
}
async function methodImplements(lineText, document, index, editor) {
    // Identificar fun��o ou procedimento
    const methodMatch = lineText.match(/^(function|procedure|constructor|destructor)\s+(\w+)\s*(\([^)]*\))?\s*(?::\s*([^;]+))?/i);
    if (methodMatch) {
        const kind = methodMatch[1];
        const name = methodMatch[2];
        const params = methodMatch[3] || "";
        const returnType = methodMatch[4] || "";
        const className = findClassNameAbove(document, index) || "Classe";
        if (!implementationExists(document, className, name)) {
            let insertLine = findClassCommentSection(document, className);
            const insertTextLines = [];
            let edit = new vscode.WorkspaceEdit();
            if (insertLine === -1) {
                insertLine = findImplementationSection(document);
                edit.insert(document.uri, new vscode.Position(insertLine, 0), `\n{ ${className} }`);
                insertLine += 2;
                await vscode.workspace.applyEdit(edit);
                await document.save();
            }
            if (lineText.includes('override')) {
                insertTextLines.push(`\n`);
                insertTextLines.push(`${kind} ${className}.${name}${params}${kind === "function" ? `: ${returnType}` : ""};`);
                insertTextLines.push(`\n`);
                insertTextLines.push(`begin`);
                if (kind === "destructor") {
                    insertTextLines.push(`\n\n  inherited;\n`);
                }
                else {
                    insertTextLines.push(`\n  inherited;\n`);
                }
                insertTextLines.push(`end;\n`);
            }
            else {
                insertTextLines.push(`\n`);
                insertTextLines.push(`${kind} ${className}.${name}${params}${kind === "function" ? `: ${returnType}` : ""};\nbegin\n\nend;\n`);
            }
            const line = document.lineAt(insertLine).text.trim();
            if (line !== '') {
                insertTextLines.push('\n');
            }
            edit = new vscode.WorkspaceEdit();
            edit.insert(document.uri, new vscode.Position(insertLine, 0), insertTextLines.join(""));
            await vscode.workspace.applyEdit(edit);
            var newPosition;
            if (lineText.includes('override')) {
                newPosition = new vscode.Position(insertLine + insertTextLines.length - 1, 0);
            }
            else {
                newPosition = new vscode.Position(insertLine + insertTextLines.length + 1, 0);
            }
            editor.selection = new vscode.Selection(newPosition, newPosition);
            editor.revealRange(new vscode.Range(newPosition, newPosition));
        }
    }
}
function implementationExists(document, className, methodName) {
    const regex = new RegExp(`\\b(${className})\\.${methodName}\\b`, 'i');
    for (let i = 0; i < document.lineCount; i++) {
        if (regex.test(document.lineAt(i).text)) {
            return true;
        }
    }
    return false;
}
function findPrivateSection(document, startLine, maxLine) {
    for (let i = startLine; i >= 0; i--) {
        if (i <= maxLine) {
            break;
        }
        if (document.lineAt(i).text.trim().toLowerCase() === "private") {
            return i;
        }
    }
    return -1;
}
function ensurePrivateSection(document, startLine) {
    const classStart = findClassStartLine(document, startLine);
    if (classStart === -1)
        return -1;
    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, new vscode.Position(classStart + 1, 0), "  private\n");
    vscode.workspace.applyEdit(edit);
    return classStart + 1;
}
function findLastFieldLineInPrivate(document, startLine, maxLine) {
    const privateStart = findPrivateSection(document, startLine, maxLine);
    if (privateStart === -1)
        return -1;
    let lastFieldLine = privateStart;
    for (let i = privateStart + 1; i < document.lineCount; i++) {
        const line = document.lineAt(i).text.trim();
        if (line === "")
            continue;
        if (/^[a-z]+$/i.test(line))
            break; // pr�xima se��o
        if (/^F\w+\s*:\s*.+;$/i.test(line)) {
            lastFieldLine = i;
        }
    }
    return lastFieldLine;
}
function findImplementationSection(document) {
    for (let i = 0; i < document.lineCount; i++) {
        if (document.lineAt(i).text.trim().toLowerCase() === "implementation") {
            return i + 1;
        }
    }
    return document.lineCount;
}
function findClassNameAbove(document, startLine) {
    for (let i = startLine; i >= 0; i--) {
        const match = document.lineAt(i).text.match(/(\w+)\s*=\s*class/i);
        if (match) {
            return match[1];
        }
    }
    return null;
}
function findClassStartLine(document, startLine) {
    for (let i = startLine; i >= 0; i--) {
        if (document.lineAt(i).text.match(/\w+\s*=\s*class/i)) {
            return i;
        }
    }
    return -1;
}
function findClassCommentSection(document, className) {
    const commentPattern = new RegExp(`^\\{\\s*${className}\\s*\\}`, 'i');
    let commentLine = -1;
    for (let i = 0; i < document.lineCount; i++) {
        if (commentPattern.test(document.lineAt(i).text.trim())) {
            return commentLine = i + 1;
        }
    }
    // let index = commentLine + 1;
    // for (let i = index; i < document.lineCount; i++) {
    // 	if (document.lineAt(i).text.trim() != '') {
    // 		return i - 1;
    // 	}
    // }
    return -1;
}
function findClassRange(document, fromLine) {
    const start = findClassStartLine(document, fromLine);
    let end = document.lineCount - 1;
    for (let i = start + 1; i < document.lineCount; i++) {
        if (/^\s*end\s*;/.test(document.lineAt(i).text)) {
            end = i;
            break;
        }
    }
    return { start, end };
}
function fieldExists(document, fieldName, classRangeStart, classRangeEnd, excludeLine) {
    const regex = new RegExp(`\\b${fieldName}\\b`, 'i');
    for (let i = classRangeStart; i <= classRangeEnd; i++) {
        if (i === excludeLine)
            continue;
        if (regex.test(document.lineAt(i).text)) {
            return true;
        }
    }
    return false;
}
function methodExists(document, methodName, classRangeStart, classRangeEnd, excludeLine) {
    const regex = new RegExp(`\\b${methodName}\\b`, 'i');
    for (let i = classRangeStart; i <= classRangeEnd; i++) {
        if (i === excludeLine)
            continue;
        if (regex.test(document.lineAt(i).text)) {
            return true;
        }
    }
    return false;
}
async function createImplementation(document, methodName, propName, type, isSetter = false) {
    const className = findClassNameAbove(document, 0) || "Classe";
    let insertLine = findClassCommentSection(document, className);
    const edit = new vscode.WorkspaceEdit();
    let methodText = isSetter
        ? `procedure ${className}.${methodName}(Value: ${type});\nbegin\n  F${propName} := Value;\nend;\n\n`
        : `function ${className}.${methodName}: ${type};\nbegin\n  Result := F${propName};\nend;\n\n`;
    if (insertLine === -1) {
        insertLine = findImplementationSection(document);
        methodText = `{ ${className} }\n\n` + methodText;
    }
    edit.insert(document.uri, new vscode.Position(insertLine, 0), methodText);
    await vscode.workspace.applyEdit(edit);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map
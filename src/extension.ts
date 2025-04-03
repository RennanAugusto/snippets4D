import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("snippets4D.addFieldToPrivate", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const document = editor.document;
    const position = editor.selection.active;
    const lineText = document.lineAt(position.line).text.trim();

    // Captura o nome da propriedade usando regex
    const match = lineText.match(/property\s+(\w+)/i);
    if (!match) {
      vscode.window.showErrorMessage("Nenhuma propriedade encontrada na linha atual.");
      return;
    }

    const propName = match[1]; // Nome da propriedade
    const fieldName = `F${propName}`; // Nome do campo privado

    let privateLine = -1;

    // Busca o primeiro 'private' acima da posição atual
    for (let i = position.line; i >= 0; i--) {
      const line = document.lineAt(i).text.trim();
      if (line.toLowerCase() === "private") {
        privateLine = i;
        break;
      }
    }

    if (privateLine !== -1) {
      const insertPosition = new vscode.Position(privateLine + 1, 0);
      const edit = new vscode.WorkspaceEdit();
      edit.insert(document.uri, insertPosition, `  ${fieldName}: Tipo;\n`);
      await vscode.workspace.applyEdit(edit);
    } else {
      vscode.window.showErrorMessage("Nenhuma seção 'private' encontrada acima!");
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}

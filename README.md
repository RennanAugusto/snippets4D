# Snippets4D

**Snippets4D** is a Visual Studio Code extension designed to speed up Delphi (Object Pascal) development by replicating classic Delphi IDE features like auto-generating fields, getters/setters, and GUIDs.

## ?? Features

### ? Generate Fields and Methods for Properties

When your cursor is on a `property` line and you press `Ctrl + Shift + C`, the extension:

- Creates the corresponding field (`F<Name>`) if referenced in `read` or `write`.
- Creates `Get` and/or `Set` methods in the `private` section if they are used.
- Automatically generates the implementation of those methods in the `implementation` section.

**Additional rules:**

- Fields and methods are inserted **after the last `F` fields** inside the `private` section.
- The `private` section is created automatically if it doesn't exist.
- The extension **checks for existing fields or methods** and avoids duplicate declarations.
- Implementations are also created only if they don’t already exist.

### ?? Generate Function/Procedure Implementations

When your cursor is on a `function` or `procedure` line and you press `Ctrl + Shift + C`, the extension:

- Automatically creates the implementation block in the `implementation` section.
- Groups implementations under `{ ClassName }`, adding the comment if missing.
- Checks for an existing implementation before generating a new one.

### ?? Generate Delphi-style GUID

Press `Ctrl + Shift + G` to insert a Delphi-compatible GUID at your cursor:
['{XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}']

## ?? Built-in Snippets

The following code snippets are also bundled with the extension:

| Prefix  | Description                      |
|---------|----------------------------------|
| `tryf`  | Creates a `try..finally` block   |
| `trye`  | Creates a `try..except` block    |
| `ifb`   | Creates an `if` block with `begin/end` |
| `ift`   | Creates a simple `if` statement without `begin/end` |
| `rai`   | Creates a `raise` statement      |
| `propf` | Declares a property with `F` backing field |
| `c`     | Basic class block                |
| `b`     | `begin..end` block               |
| `caseof`| `case..of` block                 |
| `casec` | A `case` condition line          |

> Snippets are triggered based on your configured Delphi/Object Pascal language ID in VS Code.

## ?? Notes

- Works best with Delphi language extensions that define the correct language ID (e.g., `objectpascal`, `delphi`, etc.).
- If snippets do not trigger, double-check the language mode in the bottom-right corner of VS Code.

---

Enjoy productivity-boosting Delphi development! ??


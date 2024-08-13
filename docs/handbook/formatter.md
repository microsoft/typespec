---
id: formatter
title: Formatter
---

# Formatter

TypeSpec comes with a built-in formatter. The formatter can be used in different ways:

- [Via the cli](#via-the-cli)
- Via the vscode/vs extension
- As a `prettier` plugin

## Via the cli

Format all TypeSpec files:

```bash
tsp format "**/*.tsp"
```

Check file formatting without modifying them, useful for CI enforcement.

```bash
tsp format --check "**/*.tsp"
```

## Via the VSCode or VS extension

When you use the extensions for VS Code or Visual Studio, the tsp formatter becomes automatically accessible.

If you're working within a TypeSpec file, you can format the document using the default keyboard shortcut for formatting, `alt+shift+F`.

### Configuration - Prettier

If a prettier config (`.prettierrc.yaml`, `.prettierrc.json`, etc.) is present in the project, the formatter will use the configuration from there.
By default this will then use the typespec style guide without any explicit option.

:::note
This only affect the formatting, when using `tab` key to indent it will still use the editor's configuration, so recommend setting one of the configuration below.
:::

### Configuration - VSCode

For VSCode to respect the TypeSpec standard style set the following options style

```json
{
  ["typespec"]: {
    "editor.detectIndentation": false,
    "editor.insertSpaces": true,
    "editor.tabSize": 2,
  }
}
```

### Configuration - EditorConfig

If using `.editorconfig` with the editor config extension

```editorconfig
[*.tsp]
indent_size = 2
indent_style = space
```

## Via prettier

The tsp formatter is essentially a `prettier` plugin. If you already have a `prettier` configuration set up for other languages, it can be quite handy to simply integrate TypeSpec into this existing pipeline.

In your `prettier` config file, add:

```yaml
plugins:
  - "./node_modules/@typespec/prettier-plugin-typespec"
overrides: [{ "files": "*.tsp", "options": { "parser": "typespec" } }]
```

---
id: formatter
title: Formatter
---

# Formatter

Cadl comes with a built-in formatter. The formatter can be used in different ways:

- [Via the cli](#via-the-cli)
- Via the vscode/vs extension
- As a prettier plugin

## Via the cli

Format all cadl files:

```bash
cadl format **/*.cadl
```

Validate that the files are formatted but don't format them. Useful for enforcing in CI.

```bash
cadl format --check **/*.cadl
```

## Via the VSCode or VS extension

When using the VS Code or Visual Studio extensions, the cadl formatter is automatically available.

Using the keyboard shortcut for formatting the document (`alt+shift+F` by default) when inside a Cadl file will format the document.

## Via prettier

Underneath the cadl formatter is a prettier plugin. If you already have a prettier configuration for formatting other languages it can be convenient to just have cadl plug in into this existing pipeline.

In your prettier config file, add:

```yaml
plugins:
  - "./node_modules/@cadl-lang/prettier-plugin-cadl"
overrides: [{ "files": "*.cadl", "options": { "parser": "cadl" } }]
```

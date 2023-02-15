# Installing TypeSpec to project local path

This sample shows how to install TypeSpec locally to a project and have the VS Code
extension use its locally installed language server.

See `typespec.tsp-server.path` in [.vscode/settings.json](.vscode/settings.json) and
`@typespec/compiler` dev dependency in [package.json](package.json).

## Steps

### 1. Install TypeSpec to project:

```
npm install --save-dev @typespec/compiler
```

### 2. Configure path in VS Code

- File -> Preferences
- Search for TypeSpec
- Click on Workspace tab
- Set `typespec.tsp-server.path` to `${workspaceFolder}/node_modules/@typespec/compiler`

  (NOTE: If the TypeSpec project is not at the root of the workspace, adjust the path accordingly.
  For example, `${workspaceFolder}/path/from/workspace/to/project/node_modules/@typespec/compiler`)

### 3. Commit settings.json and package.json changes

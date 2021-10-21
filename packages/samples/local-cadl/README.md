# Installing Cadl to project local path

This sample shows how to install Cadl locally to a project and have the VS Code
extension use its locally installed language server.

See `cadl.cadl-server.path` in [.vscode/settings.json](.vscode/settings.json) and
`@cadl-lang/compiler` dev dependency in [package.json](package.json).

## Steps

### 1. Install Cadl to project:
```
npm install --save-dev @cadl-lang/compiler
```

### 2. Configure path in VS Code
* File -> Preferences
* Search for Cadl
* Click on Workspace tab
* Set `cadl.cadl-server.path` to `${workspaceRoot}/node_modules/.bin/cadl-server`

  (NOTE: If the Cadl project is not at the root of the workspace, adjust the path accordingly. 
  For example, `${workspaceRoot}/path/from/workspace/to/project/node_modulues/.bin/cadl-server`)

### 3. Commit settings.json and package.json changes

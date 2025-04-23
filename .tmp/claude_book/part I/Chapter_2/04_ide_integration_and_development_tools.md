# 4. IDE Integration and Development Tools

A critical part of the TypeSpec developer experience is the integration with modern development environments. This section explores the available IDE extensions and tools that enhance productivity when working with TypeSpec.

## Visual Studio Code Integration

Visual Studio Code offers the most comprehensive TypeSpec development experience through its official extension.

### TypeSpec Extension for VS Code

The TypeSpec extension for VS Code provides features that transform the editor into a specialized environment for TypeSpec development.

#### Installation Options

If you haven't already installed the VS Code extension:

**Option 1**: Install through VS Code Marketplace

1. Open VS Code
2. Navigate to Extensions (Ctrl+Shift+X or Cmd+Shift+X on macOS)
3. Search for "TypeSpec"
4. Install the extension published by Microsoft

**Option 2**: Install through TypeSpec CLI

```bash
tsp code install
```

#### Key Features

The VS Code extension provides several productivity-enhancing features:

##### IntelliSense and Code Completion

The extension analyzes your TypeSpec code to provide context-aware suggestions:

- **Import Completion**: Suggests available libraries and modules
- **Decorator Completion**: Shows applicable decorators for the current context
- **Type Completion**: Suggests valid types when defining models and operations

##### Real-Time Diagnostics

As you type, the extension checks your code and highlights issues:

- **Syntax Errors**: Flags invalid TypeSpec syntax
- **Type Checking**: Verifies type compatibility
- **Library-Specific Rules**: Enforces rules defined by imported libraries

##### Navigation and Refactoring

The extension makes it easier to work with larger TypeSpec codebases:

- **Go to Definition**: Navigate directly to type definitions
- **Find References**: Locate all usages of a model or operation
- **Symbol Search**: Quickly find types across your project
- **Refactoring Tools**: Rename symbols across all files

##### Preview and Generation Commands

The extension integrates TypeSpec compilation into the editor workflow:

- **Preview API Documentation**: Visualize your API with rendered documentation
- **Generate From TypeSpec**: Compile and generate output with a single command
- **Import From OpenAPI**: Convert existing OpenAPI definitions to TypeSpec

##### Multi-root Workspace Support

For complex projects spanning multiple repositories or components:

- **Workspace-Aware Configuration**: Respects per-folder settings
- **Cross-Project Navigation**: Navigate references between projects

#### TypeSpec-Specific Configuration

The extension respects special configuration options that can be set in your VS Code settings:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/node_modules/@typespec/compiler",
  "typespec.format.enable": true,
  "typespec.trace.server": "off"
}
```

Key settings include:

- **tsp-server.path**: Configures the compiler location for projects using local TypeSpec installations
- **format.enable**: Enables automatic formatting of TypeSpec files
- **trace.server**: Enables server logging for troubleshooting (options: "off", "messages", "verbose")

## Visual Studio Integration

For developers working in Windows environments, the Visual Studio extension offers similar capabilities.

### TypeSpec Extension for Visual Studio

#### Installation Options

**Option 1**: Install through Visual Studio Marketplace

1. Open Visual Studio
2. Navigate to Extensions → Manage Extensions
3. Search for "TypeSpec"
4. Install the extension published by Microsoft

**Option 2**: Install through TypeSpec CLI

```bash
tsp vs install
```

#### Key Features

The Visual Studio extension shares many features with its VS Code counterpart:

- **Syntax Highlighting**
- **IntelliSense Support**
- **Live Diagnostics**
- **Navigation Tools**

#### Configuration

When working with projects that use a local TypeSpec compiler installation, configure the extension via the `.vs/VSWorkspaceSettings.json` file:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/node_modules/@typespec/compiler"
}
```

## TypeSpec CLI Tools

Beyond compilation, the TypeSpec CLI provides several tools that enhance the development workflow.

### Code Generation Commands

The TypeSpec CLI includes commands that accelerate common development tasks:

#### Project Scaffolding

The `tsp init` command offers template-based project creation with various options:

```bash
# Create a project from a specific template
tsp init --template emitter-ts

# Create a project in a specific directory
tsp init --directory my-project
```

#### Package Management

TypeSpec manages dependencies with commands for package installation:

```bash
# Install dependencies listed in package.json
tsp install

# Install a specific TypeSpec library
tsp install @typespec/openapi3
```

### Advanced CLI Features

#### Custom Emitter Support

For projects using custom emitters, the CLI provides direct invocation:

```bash
# Compile with a specific emitter
tsp compile . --emit my-custom-emitter

# Pass options to an emitter
tsp compile . --option my-emitter.verbose=true
```

#### Diagnostic Controls

Control the verbosity and format of compilation diagnostics:

```bash
# Control error reporting level
tsp compile . --warning-as-error

# Format output for CI systems
tsp compile . --format json
```

## Integration with Build Systems

TypeSpec can be integrated into various build systems for automated API generation.

### npm Scripts Integration

A common approach is to define TypeSpec scripts in your `package.json`:

```json
{
  "scripts": {
    "build": "tsp compile .",
    "watch": "tsp compile . --watch",
    "clean": "rimraf tsp-output",
    "docs": "tsp compile . --emit @typespec/html-doc"
  }
}
```

These scripts can be run with `npm run`:

```bash
npm run build
npm run watch
```

### Continuous Integration

For automated building in CI/CD pipelines:

#### GitHub Actions Example

```yaml
name: TypeSpec Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm ci
      - name: Install TypeSpec
        run: npm install -g @typespec/compiler
      - name: Build TypeSpec
        run: tsp compile .
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: api-specs
          path: tsp-output/
```

#### Azure DevOps Example

```yaml
trigger:
  - main

pool:
  vmImage: "ubuntu-latest"

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: "18.x"
    displayName: "Install Node.js"

  - script: |
      npm ci
      npm install -g @typespec/compiler
      tsp compile .
    displayName: "Build TypeSpec"

  - task: PublishBuildArtifacts@1
    inputs:
      pathtoPublish: "tsp-output"
      artifactName: "api-specs"
```

## Debugging TypeSpec

### Debug Techniques

TypeSpec provides several ways to debug your definitions:

#### Using Comments for Debugging

Insert TypeSpec comments to mark sections of interest:

```typespec
// TODO: Fix this model definition
model User {
  /* DEBUG: This property is causing an issue */
  id: string;
}
```

#### Using the `--verbose` Flag

Enable verbose output for detailed compilation information:

```bash
tsp compile . --verbose
```

#### Using Source Maps

When working with TypeSpec decorators and JavaScript/TypeScript code:

1. Generate source maps in your TypeScript configuration:

```json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

2. Use the Node.js debugger with source maps to step through decorator code.

### Troubleshooting Common Issues

#### Resolve Path Issues

If the compiler can't find files or libraries:

```bash
# Check the resolved paths
tsp compile . --print-resolution-paths
```

#### Check Configuration

Verify your configuration is being correctly read:

```bash
# Display the loaded configuration
tsp compile . --print-config
```

## Integration with Documentation Systems

TypeSpec can generate documentation in multiple formats:

### HTML Documentation

Generate HTML documentation with the `@typespec/html-doc` emitter:

```bash
npm install @typespec/html-doc
tsp compile . --emit @typespec/html-doc
```

### Markdown Documentation

Generate Markdown files for integration with documentation systems:

```bash
npm install @typespec/md-doc
tsp compile . --emit @typespec/md-doc
```

## Next Steps

With your development environment configured and tools in place, you're ready to start writing TypeSpec code. In the next chapter, we'll explore the core language concepts and syntax of TypeSpec.

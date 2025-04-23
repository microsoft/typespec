# 5. Verification and Troubleshooting

After installing TypeSpec and setting up your development environment, it's important to verify that everything is working correctly. This section will help you confirm that your installation is successful and troubleshoot common issues that might arise.

## Verifying Your TypeSpec Installation

Follow these steps to verify that TypeSpec has been installed correctly and is functioning as expected.

### Command Line Verification

1. Open a terminal or command prompt
2. Verify the TypeSpec compiler installation:

```bash
tsp --version
```

You should see output displaying the installed version, such as `0.43.0`.

3. Check that the TypeSpec CLI commands are available:

```bash
tsp --help
```

This should display the list of available commands, including `compile`, `init`, and `install`.

### Create a Test Project

The most thorough way to verify your installation is to create and compile a simple TypeSpec project:

1. Create a new directory for your test project:

```bash
mkdir typespec-test
cd typespec-test
```

2. Initialize a new TypeSpec project:

```bash
tsp init
```

Select the "Generic REST API" template when prompted.

3. Compile the project:

```bash
tsp compile .
```

4. Verify that the OpenAPI specification was generated:

```bash
# Windows
dir tsp-output\@typespec\openapi3

# macOS/Linux
ls -la tsp-output/@typespec/openapi3
```

You should see an `openapi.yaml` file in the output directory.

### Verify IDE Integration

If you're using an IDE with the TypeSpec extension, verify that it's working correctly:

1. Open your test project in VS Code or Visual Studio
2. Open the `main.tsp` file
3. Confirm that syntax highlighting is applied
4. Try hovering over a TypeSpec keyword or type to see documentation
5. Make a deliberate syntax error (e.g., remove a semicolon) and verify that the editor highlights the issue

## Common Issues and Solutions

Despite a successful installation, you may encounter some issues when working with TypeSpec. Here are solutions to common problems.

### Command Not Found

If you receive a "command not found" error when trying to run `tsp`:

#### Cause

The TypeSpec compiler is not in your system's PATH.

#### Solution

For global installations:

- Verify the installation was successful by checking for TypeSpec in your global npm packages:
  ```bash
  npm list -g @typespec/compiler
  ```
- Ensure your npm bin directory is in your PATH:
  ```bash
  # Add to PATH temporarily
  export PATH=$(npm config get prefix)/bin:$PATH # macOS/Linux
  set PATH=%APPDATA%\npm
  %PATH% # Windows
  ```

For local installations:

- Use npx to run the local version:
  ```bash
  npx tsp --version
  ```

### Missing Dependencies

If you see errors related to missing dependencies when running a TypeSpec project:

#### Cause

The TypeSpec libraries required by your project are not installed.

#### Solution

Install the dependencies:

```bash
tsp install
```

Or manually install the specific libraries:

```bash
npm install @typespec/http @typespec/rest @typespec/openapi3
```

### Compiler Version Mismatch

If you see warnings about mismatched compiler versions:

#### Cause

Different TypeSpec packages (compiler, libraries, emitters) have incompatible version requirements.

#### Solution

Ensure all TypeSpec packages use compatible versions:

1. Check your current versions:
   ```bash
   npm list | grep typespec
   ```
2. Update all packages to the same version series:
   ```bash
   npm install @typespec/compiler@next @typespec/http@next @typespec/rest@next @typespec/openapi3@next
   ```

### IDE Extension Issues

If the IDE extension isn't providing the expected features:

#### Cause

The extension may not be properly installed or configured, or may not be able to find the TypeSpec compiler.

#### Solution

1. Verify the extension is installed and enabled
2. For local TypeSpec installations, configure the extension to use your local compiler:
   ```json
   // VS Code settings.json
   {
     "typespec.tsp-server.path": "${workspaceFolder}/node_modules/@typespec/compiler"
   }
   ```
3. Restart the TypeSpec language server:
   - VS Code: Run the command "TypeSpec: Restart TypeSpec Server"
   - Visual Studio: Restart the IDE

### Compilation Errors

If you encounter errors during compilation:

#### Cause

There may be syntax errors in your TypeSpec files, incorrect configuration, or incompatible package versions.

#### Solution

1. Check for syntax errors in your TypeSpec files
2. Verify your `tspconfig.yaml` is correctly formatted
3. Try compiling with verbose output for more details:
   ```bash
   tsp compile . --verbose
   ```
4. For complex projects, try compiling individual files to isolate the issue:
   ```bash
   tsp compile specific-file.tsp
   ```

### Local Package Issues

If your project uses a local TypeSpec installation and you're experiencing issues:

#### Cause

The local installation may be corrupted or misconfigured.

#### Solution

1. Remove the node_modules directory and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```
2. Verify the package.json has the correct dependencies and versions:
   ```json
   {
     "dependencies": {
       "@typespec/compiler": "~0.43.0"
       // other typespec packages
     }
   }
   ```

## Advanced Troubleshooting

For more complex issues, TypeSpec provides several diagnostic tools.

### Verbose Logging

Enable detailed logging to see exactly what's happening during compilation:

```bash
tsp compile . --verbose
```

For even more detail, set the TypeSpec debug environment variable:

```bash
# Windows
set TSP_DEBUG=*
tsp compile .

# macOS/Linux
TSP_DEBUG=* tsp compile .
```

### Analyze Library Resolution

If you're having issues with library imports:

```bash
tsp compile . --print-resolution-paths
```

This shows how TypeSpec is resolving each import, which can help identify path issues.

### Check TypeSpec Configuration

To see the configuration that TypeSpec is using:

```bash
tsp compile . --print-config
```

This displays the merged configuration from all sources, including your tspconfig.yaml file.

### Debug Mode in IDE Extensions

Enable debug mode in your IDE extension for more verbose logging:

```json
// VS Code settings.json
{
  "typespec.trace.server": "verbose"
}
```

The logs can be viewed in the "Output" panel under "TypeSpec Language Server".

## Getting Help

If you're still experiencing issues after trying these troubleshooting steps:

### Community Resources

- **GitHub Discussions**: Post your question on the [TypeSpec GitHub Discussions](https://github.com/microsoft/typespec/discussions) page
- **Discord Community**: Join the [TypeSpec Discord server](https://aka.ms/typespec/discord) to chat with other users and the development team
- **Stack Overflow**: Ask a question with the "typespec" tag on Stack Overflow

### Reporting Bugs

If you believe you've found a bug in TypeSpec:

1. Check the [existing issues](https://github.com/microsoft/typespec/issues) to see if it's already been reported
2. If not, create a new issue with:
   - A clear description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Version information (tsp --version output)
   - Any relevant error messages or logs

## Next Steps

Now that you've verified your TypeSpec installation and know how to troubleshoot common issues, you're ready to start building more complex TypeSpec definitions. In the next chapter, we'll explore the core language concepts and syntax of TypeSpec to help you define your first API.

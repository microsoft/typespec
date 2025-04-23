# 2. Installation Process

Now that you understand the system requirements for TypeSpec, let's walk through the step-by-step process of installing TypeSpec and setting up your development environment.

## Installing the TypeSpec Compiler

TypeSpec offers multiple installation options to suit your workflow. Choose the approach that best matches your needs:

### Option 1: Global Installation (Recommended for Getting Started)

Global installation makes the TypeSpec compiler available system-wide, allowing you to use it across all your projects.

```bash
npm install -g @typespec/compiler
```

After installation, verify that TypeSpec is properly installed by running:

```bash
tsp --version
```

You should see the version number of your installed TypeSpec compiler displayed.

### Option 2: Project-Local Installation

For team environments or CI/CD pipelines, installing TypeSpec as a project dependency ensures consistent behavior across all development environments.

1. Navigate to your project directory:

```bash
cd your-project-directory
```

2. Install TypeSpec as a development dependency:

```bash
npm install --save-dev @typespec/compiler
```

3. Access the locally installed TypeSpec compiler using npx:

```bash
npx tsp --version
```

With a project-local installation, you need to configure your IDE to use the local compiler. For VS Code, add the following to your workspace settings:

```json
{
  "typespec.tsp-server.path": "${workspaceFolder}/node_modules/@typespec/compiler"
}
```

### Option 3: Standalone Installation (Experimental)

For users who prefer not to install Node.js, TypeSpec offers an experimental standalone installer:

**Windows:**

```bash
powershell -c "irm typespec.io/install.ps1|iex"
```

**macOS/Linux:**

```bash
curl -fsSL https://typespec.io/install.sh | bash
```

## Installing IDE Extensions

While TypeSpec can be used with any text editor, the IDE extensions significantly enhance the development experience with features like syntax highlighting, code completion, and real-time diagnostics.

### Installing the VS Code Extension

Option 1: Install directly from the VS Code Marketplace:

1. Open VS Code
2. Navigate to Extensions (Ctrl+Shift+X or Cmd+Shift+X on macOS)
3. Search for "TypeSpec"
4. Install the extension published by Microsoft

Option 2: Install using the TypeSpec CLI (requires the TypeSpec compiler to be installed first):

```bash
tsp code install
```

For VS Code Insiders, use:

```bash
tsp code install --insiders
```

### Installing the Visual Studio Extension

Option 1: Install directly from the Visual Studio Marketplace:

1. Open Visual Studio
2. Navigate to Extensions → Manage Extensions
3. Search for "TypeSpec"
4. Install the extension published by Microsoft

Option 2: Install using the TypeSpec CLI:

```bash
tsp vs install
```

## Verifying Your Installation

After installing TypeSpec and its IDE extensions, verify that everything is functioning correctly:

1. Open your terminal and run:

```bash
tsp --help
```

You should see a list of available TypeSpec commands.

2. Create a simple TypeSpec file to test the IDE extension:
   - Create a new file with a `.tsp` extension
   - Enter some basic TypeSpec content
   - Verify that syntax highlighting works
   - Check if hover information and code completion are available

## Installation Troubleshooting

### Common Issues and Solutions

#### Command Not Found Error

If you encounter a "command not found" error after installing TypeSpec globally, the npm global bin directory may not be in your PATH.

**Solution**: Add the npm global bin directory to your PATH.

For Windows:

```bash
# Find npm global bin directory
npm config get prefix
# Add the returned path + \bin to your PATH environment variable
```

For macOS/Linux:

```bash
# Find npm global bin directory
npm config get prefix
# Add the following to your .bashrc or .zshrc file
export PATH=$(npm config get prefix)/bin:$PATH
```

#### Permission Errors During Global Installation

If you encounter permission errors during global installation:

**Solution 1**: Use sudo (not recommended for security reasons):

```bash
sudo npm install -g @typespec/compiler
```

**Solution 2**: Fix npm permissions (recommended):

```bash
# Change npm's default directory to one you own
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Add to PATH
export PATH=~/.npm-global/bin:$PATH
# Update current session
source ~/.profile
```

#### VS Code Extension Not Finding TypeSpec

If the VS Code extension cannot find the TypeSpec compiler:

**Solution**: Configure the extension to use the correct compiler path:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "typespec"
3. Set the "Tsp-server: Path" to the correct location of your TypeSpec compiler

## Installing TypeSpec Libraries

In addition to the core compiler, TypeSpec offers various libraries that provide domain-specific functionality. Here's how to install the most commonly used ones:

### HTTP and REST Libraries

For HTTP API definitions:

```bash
npm install @typespec/http
```

For REST-specific patterns:

```bash
npm install @typespec/rest
```

### OpenAPI Emitters

For generating OpenAPI 3.0 specifications:

```bash
npm install @typespec/openapi3
```

For OpenAPI 2.0 (formerly Swagger):

```bash
npm install @typespec/openapi
```

### Additional Libraries

For versioning support:

```bash
npm install @typespec/versioning
```

For JSON Schema support:

```bash
npm install @typespec/json-schema
```

## Using Docker for TypeSpec (Optional)

If you prefer using Docker, TypeSpec provides an official Docker image:

```bash
docker run -v "${pwd}:/wd" --workdir="/wd" -t azsdkengsys.azurecr.io/typespec
```

Common Docker commands:

```bash
# Install dependencies
docker run -v "${pwd}:/wd" --workdir="/wd" -t azsdkengsys.azurecr.io/typespec install

# Compile TypeSpec
docker run -v "${pwd}:/wd" --workdir="/wd" -t azsdkengsys.azurecr.io/typespec compile .

# Initialize a new project
docker run -v "${pwd}:/wd" --workdir="/wd" -t azsdkengsys.azurecr.io/typespec init
```

## Installing Nightly Versions

For those who want to test the latest features and improvements before they're officially released, you can install nightly versions of TypeSpec packages.

On every commit to the main branch, packages with changes are automatically published to npm with the `@next` tag:

```bash
# Install the latest nightly version
npm install -g @typespec/compiler@next
```

For project-specific installation, update your package.json to use the @next tag:

```json
"dependencies": {
  "@typespec/compiler": "next",
  "@typespec/http": "next",
  "@typespec/rest": "next",
  "@typespec/openapi3": "next"
}
```

Then run:

```bash
npm update --force
```

The `--force` flag is necessary because there might be incompatible version requirements between packages.

## Next Steps

Now that you have successfully installed TypeSpec and its associated tools, you're ready to create your first TypeSpec project. In the next section, we'll walk through setting up a new TypeSpec project from scratch and explore the basic project structure.

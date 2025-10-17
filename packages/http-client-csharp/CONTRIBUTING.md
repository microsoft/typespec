# Contributing to @typespec/http-client-csharp

Welcome! This guide will help you set up your development environment and contribute to the TypeSpec HTTP Client C# package.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Debugging](#debugging)
- [Code Generation](#code-generation)
- [Creating Pull Requests](#creating-pull-requests)
- [Getting Help](#getting-help)
- [Code of Conduct](#code-of-conduct)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 20 or higher)
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) (required - see global.json for exact version)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Git](https://git-scm.com/)
- [PowerShell](https://docs.microsoft.com/powershell/scripting/install/installing-powershell) (version 7.0 or higher, for advanced testing and code generation scenarios)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/microsoft/typespec.git
cd typespec/packages/http-client-csharp
```

### 2. Install Dependencies

From the repository root:

```bash
npm ci
```

### 3. Build the C# Package

```bash
cd packages/http-client-csharp
npm run build
```

This command runs:

- `npm run build:emitter` - Builds the TypeScript emitter
- `npm run build:generator` - Builds the .NET generator
- `npm run extract-api` - Extracts API documentation

### 4. Verify Installation

After building, you can verify everything is working correctly by running:

```bash
npm run test
```

## Development Workflow

### Package Structure

The C# HTTP client package consists of two main components:

- **Emitter** (`/emitter`): TypeScript code that processes TypeSpec definitions and produces input for the generator
- **Generator** (`/generator`): .NET code that generates C# client libraries from the emitter output

### Making Changes

1. **Create a fork** of the repository and clone it:

   ```bash
   git clone https://github.com/YOUR_USERNAME/typespec.git
   cd typespec
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** to the codebase

3. **Build your changes**:

   ```bash
   # Build emitter only
   npm run build:emitter
   
   # Build generator only
   npm run build:generator
   
   # Build everything
   npm run build
   ```

4. **Test your changes**:

   ```bash
   # Test emitter only
   npm run test:emitter
   
   # Test generator only
   npm run test:generator
   
   # Test everything
   npm run test
   ```

### Code Style and Linting

- **Format code**: `npm run format`
- **Run linting**: `npm run lint`
- **Fix lint issues**: `npm run lint:fix`

## Testing

### Unit Tests

The package includes both TypeScript (emitter) and C# (generator) tests:

```bash
# Run all tests
npm run test

# Run emitter tests only (TypeScript/Vitest)
npm run test:emitter

# Run generator tests only (.NET)
npm run test:generator

# Run tests with coverage
npm run test:ci

# Run tests with UI (emitter only)
npm run test:ui
```

> **Note**: Some tests may require a full workspace build (`pnpm build` from repository root) to resolve all dependencies before running successfully.

### Integration Testing with Spector

The package uses the Spector test framework for end-to-end testing of generated code:

```bash
# Run Spector tests (requires PowerShell)
./eng/scripts/Test-Spector.ps1

# Run Spector tests with filter
./eng/scripts/Test-Spector.ps1 -filter "specific-test-name"

# Get Spector test coverage
./eng/scripts/Get-Spector-Coverage.ps1
```

### Test Project Generation

Generate test projects to validate the emitter and generator:

```bash
# Generate all test projects (requires PowerShell)
./eng/scripts/Generate.ps1

# Generate specific test project
./eng/scripts/Generate.ps1 -filter "project-name"

# Generate with stubbed mode disabled
./eng/scripts/Generate.ps1 -Stubbed $false
```

## Debugging

### Setting Up Debug Profiles

The `Add-Debug-Profile.ps1` script helps you set up debug profiles for debugging TypeSpec code generation in Visual Studio or VS Code.

#### Debugging Azure SDK Projects

To debug an Azure SDK project:

```powershell
./eng/scripts/Add-Debug-Profile.ps1 -SdkDirectory "C:\path\to\azure-sdk-for-net\sdk\storage\Azure.Storage.Blobs"
```

This will:
1. Install tsp-client if needed
2. Run tsp-client sync and generate commands
3. Copy local generator DLLs to the SDK's node_modules
4. Create a debug profile in launchSettings.json

#### Debugging OpenAI Plugin

To debug the OpenAI plugin:

```powershell
./eng/scripts/Add-Debug-Profile.ps1 -SdkDirectory "C:\path\to\openai-dotnet" -IsOpenAIPlugin
```

This will:
1. Install dependencies in the OpenAI repository
2. Build the codegen package
3. Copy local generator DLLs to the OpenAI codegen dist directory
4. Create a debug profile with OpenAILibraryGenerator

After running the script, you can select the newly created debug profile in Visual Studio or VS Code to start debugging with breakpoints.

## Code Generation

### Regenerating Test Projects

To regenerate test projects after making changes:

1. **Generate projects**:

   ```bash
   ./eng/scripts/Generate.ps1
   ```

## Creating Pull Requests

### 1. Prepare Your PR

Before creating a pull request:

- [ ] Ensure all tests pass: `npm run test`
- [ ] Ensure code is properly formatted: `npm run format`
- [ ] Ensure code is properly linted: `npm run lint:fix`
- [ ] Generate and test projects: `./eng/scripts/Generate.ps1` (if applicable)
- [ ] Update documentation if needed

### 2. Create the PR

1. Push your branch to your fork or the main repository
2. Create a pull request to the [microsoft/typespec](https://github.com/microsoft/typespec) repository
3. Provide a clear description of your changes
4. Link any related issues

## Getting Help

- **Issues**: Report bugs or request features in the [TypeSpec repository issues](https://github.com/microsoft/typespec/issues)
- **Discussions**: Join conversations in [TypeSpec discussions](https://github.com/microsoft/typespec/discussions)
- **Documentation**: Check the [TypeSpec documentation](https://typespec.io/) for more information
- **C# Customization**: See the [Customization Guide](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/.tspd/docs/customization.md)

## Code of Conduct

This project follows the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). Please be respectful and inclusive in all interactions.

Thank you for contributing! 🎉

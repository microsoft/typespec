# Contributing to @typespec/http-client-csharp

Welcome! This guide will help you set up your development environment and contribute to the TypeSpec HTTP Client C# package.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Generation](#code-generation)
- [Validating Changes Against the Azure Generator](#validating-changes-against-the-azure-generator)
- [Creating Pull Requests](#creating-pull-requests)
- [Getting Help](#getting-help)
- [Code of Conduct](#code-of-conduct)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 20 or higher)
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0) (required - see global.json for exact version)
- [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)
- [Git](https://git-scm.com/)
- [PowerShell](https://docs.microsoft.com/powershell/scripting/install/installing-powershell) (version 7.0 or higher, for advanced testing and code generation scenarios)
- [Long Path Support](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=powershell#registry-setting-to-enable-long-paths) (Windows only required to avoid path length limitations during development)

## Getting Started

### 1. Fork and Clone the Repository

First, create a fork of the repository on GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/typespec.git
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Install Dependencies

Navigate to the project directory and install the package dependencies:

```bash
cd packages/http-client-csharp
npm ci
```

### 3. Build the C# Package

```bash
npm run build
```

> [!NOTE]
> This command runs:
> - `npm run build:emitter` - Builds the TypeScript emitter
> - `npm run build:generator` - Builds the .NET generator
> - `npm run extract-api` - Extracts API documentation

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

1. **Create a feature branch** for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** to the codebase

3. **Build your changes**:

   - Build everything:
     ```bash
     npm run build
     ```
   
   - Build emitter only:
     ```bash
     npm run build:emitter
     ```
   
   - Build generator only:
     ```bash
     npm run build:generator
     ```

4. **Test your changes**:

   - Run all tests:
     ```bash
     npm run test
     ```
   
   - Test emitter only:
     ```bash
     npm run test:emitter
     ```
   
   - Test generator only:
     ```bash
     npm run test:generator
     ```

### Code Style and Linting

- **Format code**: `npm run format`
- **Run linting**: `npm run lint`
- **Fix lint issues**: `npm run lint:fix`

## Testing

### Unit Tests

The package includes both TypeScript (emitter) and C# (generator) tests:

- Run all tests:
  ```bash
  npm run test
  ```

- Run emitter tests only (TypeScript/Vitest):
  ```bash
  npm run test:emitter
  ```

- Run generator tests only (.NET):
  ```bash
  npm run test:generator
  ```

- Run tests with coverage:
  ```bash
  npm run test:ci
  ```

- Run tests with UI (emitter only):
  ```bash
  npm run test:ui
  ```

> [!IMPORTANT]
> Some tests may require a full workspace build to resolve all dependencies before running successfully.
> From the repository root:
> 1. run `pnpm install` to install dependencies.
> 1. run `pnpm build`

### Integration Testing with Spector

The package uses the Spector test framework for end-to-end testing of generated code:

- Run Spector tests (requires PowerShell):
  ```bash
  ./eng/scripts/Test-Spector.ps1
  ```

- Run Spector tests with filter:
  ```bash
  ./eng/scripts/Test-Spector.ps1 -filter "specific-test-name"
  ```

- Get Spector test coverage:
  ```bash
  ./eng/scripts/Get-Spector-Coverage.ps1
  ```

### Test Project Generation

Generate test projects to validate the emitter and generator:

- Generate all test projects (requires PowerShell):
  ```bash
  ./eng/scripts/Generate.ps1
  ```

- Generate specific test project:
  ```bash
  ./eng/scripts/Generate.ps1 -filter "project-name"
  ```

- Generate with stubbed mode disabled:
  ```bash
  ./eng/scripts/Generate.ps1 -Stubbed $false
  ```

## Code Generation

### Regenerating Test Projects

To regenerate test projects after making changes:

```bash
./eng/scripts/Generate.ps1
```

### Regenerating Azure Libraries

To regenerate Azure libraries using your local changes:

```bash
./eng/scripts/RegenPreview.ps1 <path-to-clone-of-azure-sdk-for-net>
```

This will regenerate all the Azure libraries and allow you to view any potential diffs your changes may cause. For more information on the script's usage, see [RegenPreview](./eng/scripts/docs/RegenPreview.md).

## Validating Changes Against the Azure Generator

When making changes to the TypeSpec HTTP Client C# package that contain API breaking changes, it can be helpful to validate these changes against the Azure generator that depends on this package. This validation serves two important purposes:

1. **Breaking Change Awareness**: Understand the full impact of your changes on downstream consumers
2. **Preparation for Azure Generator Updates**: Identify and prepare the necessary changes that the Azure Generator will need to accommodate your breaking changes

Once breaking changes are merged and a new official generator version is published, the Azure generator will be blocked from releasing until it has been updated to absorb these breaking changes. By validating your changes early, you can help minimize disruption to the Azure SDK release cycle.

Follow these steps to test your changes:

### 1. Create a Fork of azure-sdk-for-net

Create a fork of the [azure-sdk-for-net repository](https://github.com/Azure/azure-sdk-for-net):

1. Navigate to https://github.com/Azure/azure-sdk-for-net
2. Click the "Fork" button to create your own fork
3. Clone your fork locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/azure-sdk-for-net.git
   cd azure-sdk-for-net
   ```

### 2. Publish Generator Dev Artifacts

Run the generator publish pipeline to create dev artifacts from your changes:

1. Navigate to the [Generator Publish Pipeline](https://dev.azure.com/azure-sdk/internal/_build?definitionId=6871)
2. Click "Run pipeline"
3. In the source branch field, provide your PR reference in the format `refs/pull/123/merge` (replace `123` with your actual PR number)
4. Run the pipeline - this will publish the generator dev artifacts to the dotnet dev nuget feed

### 3. Update Package Versions in Azure Generator

In your azure-sdk-for-net fork, update the generator package versions to use your dev artifacts:

1. Navigate to the azure generator directory in your fork
2. Run the BumpMTG script with your PR ID:

   ```powershell
   .\eng\scripts\BumpMTG.ps1 123
   ```

   Replace `123` with the PR ID you used in step 2.

This script will update the NuGet package versions of the generator to point to your dev artifacts.

### 4. Build the Azure Generator

Build the azure generator with your updated dependencies:

```bash
npm ci && npm run clean && npm run build
```

### 5. Validate Your Changes

Now you can validate your changes by:

- **Running tests**: Execute the test suite to ensure no regressions
- **Regenerating test libraries**: Use the generator to regenerate existing test libraries and verify the output
- **Testing new features**: If you added new functionality, test it with relevant TypeSpec definitions
- **Checking integration**: Ensure the integration between your changes and the Azure generator works as expected

This validation process helps ensure that your changes to the generator are compatible with the downstream Azure generator. If breaking changes are expected, you can prepare the required changes to the Azure Generator ahead of time to reduce the time it will take to fix and upgrade the Azure Generator once your changes merge and are consumed by the Azure Generator.

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

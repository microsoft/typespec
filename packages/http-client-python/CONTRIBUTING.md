# Contributing to @typespec/http-client-python

Welcome! This guide will help you set up your development environment and contribute to the TypeSpec HTTP Client Python package.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Creating Pull Requests](#creating-pull-requests)
- [Downstream Testing](#downstream-testing)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [pnpm](https://pnpm.io/) (for workspace management)
- [Git](https://git-scm.com/)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/microsoft/typespec.git
cd typespec/packages/http-client-python
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Package

```bash
npm run build
```

### 4. Verify Installation

After building, you can verify everything is working correctly by running:

```bash
npm run regenerate
npm run ci
```

## Development Workflow

### Making Changes

1. **Create a feature branch** from the main branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** to the codebase

3. **Build and test** your changes:

   ```bash
   npm run build
   npm run regenerate
   npm run ci
   ```

4. **Add a changeset** (required for all changes):

   ```bash
   # Navigate to the root of the TypeSpec repository
   cd ../../
   pnpm changeset add
   ```

   Follow the prompts to describe your changes. This helps with automated changelog generation and versioning.

### Code Style and Linting

- Run linting: `npm run lint`
- Format code: `npm run format`

## Creating Pull Requests

### 1. Prepare Your PR

Before creating a pull request:

- [ ] Ensure all tests pass: `npm run regenerate && npm run ci`
- [ ] Ensure code is properly formatted: `npm run format`
- [ ] Ensure code is properly linted: `npm run lint`
- [ ] Add a changeset: `pnpm changeset add` (from repo root)
- [ ] Update documentation if needed

### 2. Create the PR

1. Push your branch to your fork or the main repository
2. Create a pull request to the [microsoft/typespec](https://github.com/microsoft/typespec) repository
3. Provide a clear description of your changes
4. Link any related issues

## Downstream Testing

Due to the integration with `@azure-tools/typespec-python`, we require downstream testing to ensure compatibility.

### Automatic Downstream PR Creation

After your PR is created and CI passes:

1. **Get the build artifact URL**:

   - In your PR's CI results, click on "5 published; 1 consumed" (or similar)
   - Navigate to: `Published artifacts` → `build_artifacts_python` → `packages` → `typespec-http-client-python-x.x.x.tgz`
   - Click the three dots and select "Copy download url"

2. **Trigger downstream testing**:

   - Run [this pipeline](https://dev.azure.com/azure-sdk/internal/_build/results?buildId=4278466&view=results) with:
     - `PULL-REQUEST-URL`: Your PR URL from step 1
     - `ARTIFACTS-URL`: The artifact URL from step 1

3. **Review downstream changes**:

   - The pipeline will create a PR in [autorest.python](https://github.com/Azure/autorest.python)
   - Follow the [autorest.python CONTRIBUTING.md](https://github.com/Azure/autorest.python/blob/main/CONTRIBUTING.md) for any additional changes needed

4. **Merge process**:
   - Ensure the downstream PR passes all tests
   - Merge your original TypeSpec PR once downstream testing is complete

### Post-Release Updates

After your changes are released:

1. Update the [autorest.python](https://github.com/Azure/autorest.python) repository to use the released version
2. Run `pnpm install` to update dependency mappings
3. Release the autorest emitters with your changes

## Getting Help

- **Issues**: Report bugs or request features in the [TypeSpec repository issues](https://github.com/microsoft/typespec/issues)
- **Discussions**: Join conversations in [TypeSpec discussions](https://github.com/microsoft/typespec/discussions)
- **Documentation**: Check the [TypeSpec documentation](https://typespec.io/) for more information

## Code of Conduct

This project follows the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). Please be respectful and inclusive in all interactions.

Thank you for contributing! 🎉

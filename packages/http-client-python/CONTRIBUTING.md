# Contributing to @typespec/http-client-python

Welcome! This guide will help you set up your development environment and contribute to the TypeSpec HTTP Client Python package.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Creating Pull Requests](#creating-pull-requests)
- [Downstream Testing](#downstream-testing)
- [Release Process](#release-process)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 22 or higher)
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
   pnpm change add
   ```

   Follow the prompts to describe your changes. This helps with automated changelog generation and versioning.

### Code Style and Linting

- Run linting: `npm run lint`
- Format code: `npm run format`

### Updating Emitter Option Documentation

The emitter options documentation is **auto-generated** — do not edit it by hand.

- The single source of truth is the option definitions in [`emitter/src/lib.ts`](./emitter/src/lib.ts). Update the `description` (and other schema fields) there.
- Running `npm run regen-docs` regenerates **both** targets from that source:
  - This package's [`README.md`](./README.md) (the `Emitter options` section).
  - The website reference docs under `website/src/content/docs/docs/emitters/clients/http-client-python/reference/`.

Because `regen-docs` reads the **compiled** emitter, always build first:

```bash
npm run build
npm run regen-docs
```

If you edit `lib.ts` but skip `npm run build`, `regen-docs` will regenerate from the stale `dist/` output and your changes won't appear.

## Creating Pull Requests

### 1. Prepare Your PR

Before creating a pull request:

- [ ] Ensure all tests pass: `npm run regenerate && npm run ci`
- [ ] Ensure code is properly formatted: `npm run format`
- [ ] Ensure code is properly linted: `npm run lint`
- [ ] Add a changeset: `pnpm change add` (from repo root)
- [ ] Update documentation if needed (if you changed emitter options in `lib.ts`, run `npm run build && npm run regen-docs` — see [Updating Emitter Option Documentation](#updating-emitter-option-documentation))

### 2. Create the PR

1. Push your branch to your fork or the main repository
2. Create a pull request to the [microsoft/typespec](https://github.com/microsoft/typespec) repository
3. Provide a clear description of your changes
4. Link any related issues

## Downstream Testing

This package (`@typespec/http-client-python`) is the **unbranded emitter**. It is wrapped by the **branded emitter** (`@azure-tools/typespec-python`), which lives in [Azure/typespec-azure](https://github.com/Azure/typespec-azure/tree/main/packages/typespec-python).

### How CI Works

When you open a PR against this package:

1. **Unbranded emitter CI** runs automatically (build, lint, test, regenerate).
2. **Branded emitter CI** also runs automatically — it builds `@azure-tools/typespec-python` from [`Azure/typespec-azure`](https://github.com/Azure/typespec-azure/tree/main/packages/typespec-python) against your PR's version of `@typespec/http-client-python` to verify compatibility.

Both must pass before your PR can be merged.

### Manual Regeneration Testing

You can manually trigger the [TypeSpec Python Regenerate Tests](https://github.com/Azure/azure-sdk-for-python/actions/workflows/typespec-python-regenerate.yml) workflow in `azure-sdk-for-python` to regenerate tests. The workflow checks out `microsoft/typespec` (at the ref you specify, defaulting to `main`), builds the regeneration infrastructure, installs the target emitter from npm, and runs the full regeneration.

### Post-Release: Updating azure-sdk-for-python

Once a new version of this emitter is released, follow these steps to update `azure-sdk-for-python`:

1. Follow skill [emitter-package-update](https://github.com/Azure/azure-sdk-for-python/tree/main/.github/skills/emitter-package-update) to **create a PR** to update `eng/emitter-package.json` and `eng/emitter-package-lock.json` and submit them to `azure-sdk-for-python`.

4. **Automatic regeneration**: Once the PR merges to `main`, the [TypeSpec Python Regenerate Tests](https://github.com/Azure/azure-sdk-for-python/actions/workflows/typespec-python-regenerate.yml) workflow triggers automatically (it watches for changes to `eng/emitter-package.json`). It regenerates all test code and creates a follow-up issue with the updated generated files.

5. **Generated code location**: The regenerated tests are checked in at [`eng/tools/azure-sdk-tools/emitter/generated`](https://github.com/Azure/azure-sdk-for-python/tree/typespec-python-generated-tests/eng/tools/azure-sdk-tools/emitter/generated) in `azure-sdk-for-python`, split into:
   - `azure/` — Tests generated with the branded emitter (Azure HTTP specs)
   - `unbranded/` — Tests generated with the unbranded emitter (HTTP specs)

## Release Process

The release process for `@typespec/http-client-python` follows these steps:

### 1. Version Bump

From the root of the TypeSpec repository, run:

```bash
pnpm chronus version --only @typespec/http-client-python --ignore-policies
```

This consumes all pending change files under `.chronus/changes/` for this package and bumps the version in `package.json` accordingly. Run `npm install` to update the `package-lock.json`.

### 2. Create a Release PR

Create a branch from the version bump commit and open a PR to `main`:

```bash
git checkout -b publish/python-release-<MM-DD>
git push origin publish/python-release-<MM-DD>
```

> **Note:** The branch **must** use the `publish/` prefix. This tells CI to skip certain checks (consistency, external-integration) and enables auto-publish on merge.

### 3. Merge and Publish

Once the release PR is reviewed and merged to `main`, the CI publish pipeline automatically:

1. Builds the package with the new version
2. Publishes the npm tarball to the public npm registry

No manual publish step is needed — merging the `publish/` branch triggers the release.

## Getting Help

- **Issues**: Report bugs or request features in the [TypeSpec repository issues](https://github.com/microsoft/typespec/issues)
- **Discussions**: Join conversations in [TypeSpec discussions](https://github.com/microsoft/typespec/discussions)
- **Documentation**: Check the [TypeSpec documentation](https://typespec.io/) for more information

## Code of Conduct

This project follows the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). Please be respectful and inclusive in all interactions.

Thank you for contributing! 🎉

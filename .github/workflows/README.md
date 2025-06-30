# TypeSpec Workflows

This directory contains the GitHub workflows used for TypeSpec repository CI/CD processes.

## Available Workflows

| Workflow                   | Description                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `consistency.yml`          | Ensures code consistency, including changelog, spellcheck, formatting, and linting |
| `codeql.yml`               | Runs CodeQL analysis for code security                                             |
| `external-integration.yml` | Optional CI check that verifies compatibility with Azure/typespec-azure repository |

## TypeSpec-Azure Integration Check

The `external-integration.yml` workflow verifies that changes in the TypeSpec repository do not break compatibility with the Azure/typespec-azure repository, which depends on TypeSpec as a core dependency.

### How It Works

1. Clones the Azure/typespec-azure repository
2. Finds the "core" submodule that references microsoft/typespec
3. Updates that submodule to use the changes from the current PR
4. Runs the build and tests for the Azure/typespec-azure repository

### When It Runs

This check runs on:

- Pull requests to the main branch
- Manual triggers via workflow_dispatch

### What It Checks

- Whether the Azure/typespec-azure repository can build successfully with the changes from the PR
- Whether all tests in the Azure/typespec-azure repository pass with the changes

### Configuration

This is an optional check that won't block PRs from being merged. It only runs on Linux with Node LTS (24.x) to minimize resource usage while still catching compatibility issues.

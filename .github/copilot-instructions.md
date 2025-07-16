# Copilot Instructions

This document serves as an index to task-specific instructions for GitHub Copilot. Each task has its own detailed instructions file in the `.github/prompts` directory.

## Install and Build

- Packages are located in the `packages` folder
- Use `pnpm` as the package manager
- Use `pnpm install` to install dependencies
- Use `pnpm build` to build every package
- Use `pnpm -r --filter "<pkgName>..." build` to build to a specific package `<pkgName>`
- Use `pnpm format` to format all files

## Describing changes

- Repo use `@chronus/chronus` for changelogs
- Use `pnpm change add` to add a change description for the touched packages
- Types of changes are described in `.chronus/config.yaml`

## Available Task Instructions

- [Testserver Generation](./prompts/testserver-generation.md): Instructions for generating TypeSpec HTTP spec test servers

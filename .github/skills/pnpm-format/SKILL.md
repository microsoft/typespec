---
name: pnpm-format
description: Format the codebase with pnpm and recover from common formatting failures.
---

# Format code with pnpm

Use this skill any time formatting is required in the TypeSpec repo. Do not assume formatting happens automatically; always run `pnpm format` following this guidance.

## Preconditions

- Command must run from the repository root (where `package.json` and `pnpm-workspace.yaml` live).
- Dependencies must be installed.

## Steps

1. Confirm you are at the repo root.
2. If `node_modules` are missing or `pnpm` complains about missing packages, run:
   ```bash
   pnpm install
   ```
3. Run the formatter:
   ```bash
   pnpm format
   ```
4. If the command fails with `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`, you are not at the repo root. `cd` to the root and retry.
5. If `pnpm format` exits with a non-zero code but prints a list of changed files, re-run `pnpm format` once to ensure a clean exit.

## Notes

- Do not cancel the command; formatting may take about a minute.

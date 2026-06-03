---
name: minimal-repro
description: >
  Help create a minimal reproduction for a TypeSpec compiler or emitter bug.
  Use when a user provides TypeSpec source (pasted code or a GitHub URL) and
  describes an issue. Reproduces locally and reduces to a single-file repro.
---

# Minimal Reproduction

Reduce a user-reported TypeSpec bug to the smallest single `.tsp` file that still triggers the issue.

## Inputs

- TypeSpec source (pasted or GitHub URL)
- Error description (diagnostic code, message, or incorrect emitter output)

## Environment

Use `packages/samples/scratch/` as the working directory — it's gitignored and the `packages/samples` package already depends on compiler, http, rest, openapi3, versioning, json-schema, etc.

If the repro needs packages NOT in the workspace (e.g., `@azure-tools/*`), use a temp folder with `npm install` instead.

## Steps

1. **Reproduce** — Write the user's code to `packages/samples/scratch/main.tsp`, compile with `npx tsp compile main.tsp` (add `--emit <emitter>` if relevant), and confirm the same error occurs.

2. **Minimize** — Iteratively remove code (unused imports, models, properties, decorators, operations, namespaces) and re-compile after each removal. Keep only what's needed to trigger the same error. Undo any removal that makes the error disappear.

3. **Present** — Show the final minimal `.tsp`, the compile command, and the error output. Suggest pasting into a GitHub issue or the [TypeSpec Playground](https://typespec.io/playground).

4. **Cleanup** — Remove scratch files (`rm -f packages/samples/scratch/*.tsp packages/samples/scratch/tspconfig.yaml && rm -rf packages/samples/scratch/tsp-output`).

## Tips

- Most reproductions reduce to a single file with no namespaces needed.
- Remove `@service`, `@server`, `@doc`, `@info` early — they're rarely relevant.
- Combine multi-file code into one file by inlining.
- If the error doesn't reproduce, check for missing `import`/`using` statements.

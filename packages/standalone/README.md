# TypeSpec CLI Standalone Package

This package contains the logic for building and bundling the TypeSpec CLI as a standalone executable.

It requires Node.js 25.5+ to build: the executable is produced in one step with
[`node --build-sea`](https://nodejs.org/api/single-executable-applications.html). This package only
targets the latest Node.js — supporting older versions is a non-goal. The end user runs the
self-contained executable and does not need any Node.js version installed.

## Bundled compiler

The executable ships with a **pinned** `@typespec/compiler` (the version built alongside it)
embedded directly inside the single-executable. The compiler's `tsp init` templates are embedded as
executable assets and served from memory, so running commands such as `tsp init` outside of an
installed project needs **no network access, no package manager, and no files written to disk**.

The standard library is **not** bundled. The bundled compiler is a bootstrapper: it runs `init`,
`--version`, `--help`, and `format` offline, while `compile` always uses a project-local
`@typespec/compiler`. Running `tsp compile` with no local compiler installed fails with guidance to
run `tsp install` / `tsp init` first.

Compiler resolution at runtime:

1. `--server <path>` / `TYPESPEC_COMPILER_PATH` — used if provided.
2. A `@typespec/compiler` resolvable from the current working directory (a project-local install)
   always takes precedence over the bundled one.
3. Otherwise the pinned compiler bundled into the executable is used.

To upgrade the compiler used outside of a project, install a newer executable; there is no runtime
self-update.

## Implementation notes: long-term design vs. temporary workarounds

**Long-term design** (inherent to shipping a self-contained executable):

- The bundled compiler is a **bootstrapper**: it bundles only the `tsp init` templates, not the
  standard library. `src/cli.ts` (`requireLocalCompilerForCompile`) fails fast with actionable
  guidance if `compile` is run with no project-local compiler installed.
- The `tsp init` templates are embedded as a single-executable asset (a map of template-relative
  path to file contents). `compiler-entry.ts` builds an `InMemoryTemplateSource` from that asset and
  passes it to the CLI via `runTypeSpecCli({ coreTemplateSource })` (from
  `@typespec/compiler/internals/standalone`), so `init` serves templates fully from memory while
  everything else uses the real `NodeHost`. No global state is shared between the CJS and ESM
  entrypoints, and the compiler's host contract (`getExecutionRoot`) is left untouched.
- In-memory module serving via `module.registerHooks` (`ensureHooks`/`serveFromMemory` in
  `src/module-loader.ts`): SEA assets are strings in memory, so hooks map synthetic URLs to those
  sources.
- The compiler is bundled as a separate ESM asset because it uses top-level `await`, which a
  CommonJS single-executable main cannot.

**Temporary workarounds** (remove when the linked upstream issue is fixed — each is tagged with a
`WORKAROUND(...)` comment in the code):

| Where                                                                     | Issue                                                            | What / removal                                                                                                                                     |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/import-workaround.ts` (the `createRequire` bridge, `importExternal`) | [nodejs/node#62726](https://github.com/nodejs/node/issues/62726) | A SEA main can only import _builtin_ modules. Once fixed, delete this file and replace `importExternal(specifier)` calls with `import(specifier)`. |

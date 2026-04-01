# Dependency Audit Tracker

Comprehensive audit of all external dependencies across TypeSpec workspace packages.
Excludes standalone emitters: `http-client-csharp`, `http-client-java`, `http-client-python`.

---

## 🔴 Unused Dependencies — Remove

- [x] **`grammarkdown`** — Remove from `packages/compiler/package.json`. No imports or script references found anywhere in the codebase.
- [x] **`json5`** — Remove from `packages/bundle-uploader/package.json`. No imports found in any source file.
- [x] **`date-fns`** — Remove from `website/package.json`. No imports found anywhere under `website/`.

---

## 🟡 Redundant with Existing Tooling

- [x] **`c8`** (per-package devDeps) — Remove `c8` from individual package devDependencies (29 packages). The repo uses `@vitest/coverage-v8` for coverage. Only the root `package.json` uses `c8` directly in the `merge-coverage` script — keep it there or migrate that script.
  - Affected packages: `asset-emitter`, `best-practices`, `bundle-uploader`, `bundler`, `compiler`, `eslint-plugin-typespec`, `events`, `html-program-viewer`, `http`, `internal-build-utils`, `json-schema`, `library-linter`, `monarch`, `openapi`, `openapi3`, `pack`, `playground`, `playground-website`, `protobuf`, `react-components`, `rest`, `sse`, `standalone`, `streams`, `tspd`, `typespec-vscode`, `versioning`, `xml`
- [x] **`body-parser`** — Replace with Express 5 built-in `express.json()` / `express.urlencoded()` in `packages/spector/src/server/server.ts`. Also remove `@types/body-parser` from spector devDeps.

---

## 🟠 Replace with Node.js Built-ins

- [x] **`deep-equal`** — Replace with `node:util.isDeepStrictEqual()`. Used in 3 files:
  - `packages/spec-api/src/expectation.ts`
  - `packages/spec-api/src/request-validations.ts`
  - `packages/spector/src/actions/server-test.ts`
  - Also remove `@types/deep-equal` from `http-specs`, `spec-api`, `spector`.
- [x] **`fs-extra`** — Replace with `node:fs/promises` + `fs.cp()`. Used in 3 eng/ scripts only:
  - `packages/http-client-js/eng/scripts/emit-e2e.js`
  - `packages/http-server-js/eng/scripts/emit-e2e.js`
  - `packages/http-server-csharp/eng/scripts/emit-scenarios.ts`

---

## 🟠 Library Consolidation

- [x] **`inquirer` → `@inquirer/prompts`** — The legacy monolith `inquirer` (v13) is used in 3 eng/ scripts. The modern modular `@inquirer/prompts` (v8) is already used in the compiler. Consolidate to `@inquirer/prompts`.
  - `inquirer` locations:
    - `packages/http-client-js/eng/scripts/emit-e2e.js`
    - `packages/http-server-js/eng/scripts/emit-e2e.js`
    - `packages/http-server-csharp/eng/scripts/emit-scenarios.ts`
  - `@inquirer/prompts` locations:
    - `packages/compiler/src/init/init.ts`
    - `packages/compiler/src/init/prompts.ts`
- [ ] **`onigasm` → `vscode-oniguruma`** — `onigasm` is stale (last updated May 2022) and superseded by `vscode-oniguruma` which is already a devDep of compiler. Used in 1 file:
  - `packages/tmlanguage-generator/src/tmlanguage-generator.ts`
- [ ] **`lzutf8`** — Stale since July 2022. Consider replacing with `lz-string` or the browser `CompressionStream` API. Used in 1 file:
  - `packages/playground/src/state-storage.ts`

---

## 🔵 Monitor — No Immediate Action

- [ ] **`postject`** — Alpha (`1.0.0-alpha.6`), last updated May 2023. Used for Node.js SEA injection in `packages/standalone/scripts/build.ts`. No stable alternative — this is the official approach. Monitor for stable release.
- [ ] **`es-module-shims`** — Polyfill for import maps in older browsers. Used in `packages/playground-website/index.html` and `packages/playground/.storybook/preview-head.html`. May become unnecessary as browser support improves.
- [ ] **`vite-plugin-dts`** — Pinned at `4.5.4` across 5 packages. Still maintained (last update July 2025). Pin is likely intentional — verify if newer versions work and unpin.
- [ ] **`xml2js`** — Not officially deprecated on npm but widely considered legacy. Used in `packages/spec-api/src/request-validations.ts`. Consider `fast-xml-parser` as a modern alternative when convenient.

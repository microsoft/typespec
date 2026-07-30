---
changeKind: internal
packages:
  - tmlanguage-generator
  - "@typespec/streams"
  - "@typespec/spec-coverage-sdk"
  - "@typespec/library-linter"
  - "@typespec/bundler"
---

Enable `verbatimModuleSyntax` in TypeScript configuration and convert type-only imports and re-exports to `import type` / `export type` accordingly.

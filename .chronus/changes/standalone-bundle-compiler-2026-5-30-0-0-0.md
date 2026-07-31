---
changeKind: internal
packages:
  - "@typespec/compiler"
---

Add internal `runTypeSpecCli` API (behind `@typespec/compiler/internals/standalone`) so a self-contained CLI can run the compiler CLI with a custom `CompilerHost` that serves the compiler's `init` templates from an in-memory asset map, running `tsp init` offline without a package manager, network access, or writing files to disk.

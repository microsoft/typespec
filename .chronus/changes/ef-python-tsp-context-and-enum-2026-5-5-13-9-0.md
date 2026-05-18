---
changeKind: fix
packages:
  - "@typespec/emitter-framework"
---

Fix `TspContext is not set` error in the Python components when consumers import EF Python from a subpath (`@typespec/emitter-framework/python`) while the public `useTsp` is imported from `@typespec/emitter-framework`. The Python sources used Node `imports` subpath references (`#core/*`, `#python/*`) that resolved differently from the main package's `exports` map under bundler conditions, leading to two distinct `TspContext` symbols. Replaced those subpath imports with relative paths so all components share a single context (mirroring the TypeScript components). Also added `Enum` to `isDeclaration` in the Python `TypeExpression` so referenced enums correctly render as references to their generated class instead of falling into the `python-unsupported-type` branch.
---
changeKind: internal
packages:
  - "@typespec/compiler"
---

Refactor `tsp init` template loading around a URI-based `TemplateSource` abstraction. A `UriTemplateSource` handles local and remote templates (paths and URLs), while built-in ("core") templates are addressed through an `internal:` scheme that resolves to an injectable provider. This lets alternative hosts (e.g. an offline single-executable compiler) serve bundled templates via an `InMemoryTemplateSource` without coupling template loading to the `CompilerHost` filesystem.

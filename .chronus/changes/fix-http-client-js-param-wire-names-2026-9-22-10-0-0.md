---
changeKind: fix
packages:
  - "@typespec/http-client-js"
---

Use the HTTP wire name for path, query and header parameters. The keys passed to the URI template `expand()` now match the template variables (for example `@query("filter[isActive]")` or `@path("function") functionName`), and headers declared with an explicit name (for example `@header("X-Count") count`) are sent under that name.

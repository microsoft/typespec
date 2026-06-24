---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Keep the `is`/`extends` keyword on the declaration line when the base is a template reference with multiple arguments. The template argument list now controls the line breaking instead of the keyword being pushed onto its own indented line.

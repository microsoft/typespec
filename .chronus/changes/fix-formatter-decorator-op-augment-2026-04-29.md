---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix formatting of decorators on operations and augment decorators. Decorators on operations now break to separate lines when the total line exceeds the print width. Augment decorator arguments are now consistently indented when the line breaks, matching TypeScript/prettier function call formatting.

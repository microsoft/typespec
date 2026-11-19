---
changeKind: fix
packages:
  - "@typespec/emitter-framework"
---

Make language-specific Alloy peer dependencies optional so emitters only need to install the language packages they use, while keeping Alloy core and the TypeSpec compiler required. The TypeScript-specific `Experimental_CustomTypeToProps` type is exported from the TypeScript entry point rather than the root entry point.
---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Deprecate `@typespec/compiler/emitter-framework` export in favor of a new package `@typespec/asset-emitter`
  ```diff lang=json title=package.json
  "dependencies": {
  +   "@typespec/asset-emitter": "0.67.0"
  }
  ```
  
  ```diff lang=ts
  -import { TypeEmitter, ... } from "@typespec/compiler/emitter-framework";
  +import { TypeEmitter, ... } from "@typespec/asset-emitter";
  ```

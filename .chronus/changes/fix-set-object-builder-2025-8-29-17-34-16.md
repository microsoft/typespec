---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: deprecation
packages:
  - "@typespec/asset-emitter"
---

Deprecate use of `ObjectBuilder#set` in favor of `setProperty`
  ```diff lang=ts
  - builder.set("key", value);
  + setProperty(builder, "key", value);
  ```

---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Remove a legacy behavior of resolving package names which wasn't inline with node ESM module resolution.

  For example if you were running tsp compile within your node_modules folder(on a test package) and referencing your emitter by name you might need to change this
  ```diff lang=bash 
  -tsp compile . --emit my-emitter
  +tsp compile . ../../  # path to your emitter root instead
  ```

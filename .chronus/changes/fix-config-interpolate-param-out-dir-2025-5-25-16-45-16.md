---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

Config interpolation is more flexible in interpolating variables in any order as long as no circular reference occur. For example using `{output-dir}` in parameters.

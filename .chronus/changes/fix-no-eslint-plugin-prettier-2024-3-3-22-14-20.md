---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/eslint-config-typespec"
---

Remove dependency on `eslint-plugin-prettier` which wasn't used and it a bad pattern to use prettier

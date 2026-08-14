---
changeKind: fix
packages:
  - "@typespec/compiler"
---

`tsp install` now respects the `.npmrc` configuration(project, user and global config as well as `npm_config_*` environment variables) when resolving and downloading the package manager. Custom registries(including scoped registries) and their credentials(`_authToken`, `_auth` and `username`/`_password`) are now used.

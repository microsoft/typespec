---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

[Python] Fix duplicate `:keyword:`/`:paramtype:` lines in generated model docstrings and remove `docstring-missing-param` pylint suppressions that became useless with `azure-pylint-guidelines-checker` `0.5.9`

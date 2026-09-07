---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add support for defining a linter ruleset in a standalone yaml file and referencing it with the `file:` prefix in `linter.extends`. This lets a repository share and version a set of linter rules without depending on a library release.

```yaml
# tspconfig.yaml
linter:
  extends:
    - "file:../common-rules.yaml"
```

```yaml
# common-rules.yaml
extends:
  - "@typespec/best-practices/recommended"
enable:
  "@typespec/best-practices/new-rule": true
disable:
  "@typespec/best-practices/foo": "This rule is too strict for this repository"
```

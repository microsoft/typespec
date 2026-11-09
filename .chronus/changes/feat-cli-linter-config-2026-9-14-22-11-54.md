---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Override linter configuration for a single compilation without editing `tspconfig.yaml`. Select rulesets with `--linter-ruleset`, enable, disable, or configure individual rules with `--linter-rule`, and skip linting with `--no-linter`.

```bash
tsp compile . --linter-ruleset @typespec/http/all
tsp compile . --linter-rule @typespec/compiler/unused-using=true
tsp compile . --no-linter
```
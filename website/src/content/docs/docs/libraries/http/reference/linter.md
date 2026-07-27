---
title: "Linter usage"
---

## Usage

Add the following in `tspconfig.yaml`:

```yaml
linter:
  extends:
    - "@typespec/http/all"
```

## RuleSets

Available ruleSets:

- `@typespec/http/all`

## Rules

| Name                                                                                                      | Description                                                                                           |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [`@typespec/http/op-reference-container-route`](../rules/op-reference-container-route.md)                 | Check for referenced (`op is`) operations which have a @route on one of their containers.             |
| [`@typespec/http/no-content-type-optionality-mismatch`](../rules/no-content-type-optionality-mismatch.md) | The optionality of the Content-Type header must match the optionality of the associated request body. |

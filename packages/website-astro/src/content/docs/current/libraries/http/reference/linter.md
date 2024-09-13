---
title: "Linter usage"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Linter

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

| Name                                                                                                   | Description                                                                               |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [`@typespec/http/op-reference-container-route`](/libraries/http/rules/op-reference-container-route.md) | Check for referenced (`op is`) operations which have a @route on one of their containers. |

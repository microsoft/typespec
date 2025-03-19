---
title: "Emitter usage"
---

## Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-python
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-python"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-python"
options:
  "@typespec/http-client-python":
    option: value
```

## Emitter options

### `package-version`

**Type:** `string`

### `package-name`

**Type:** `string`

### `output-dir`

**Type:** `string`

### `generate-packaging-files`

**Type:** `boolean`

### `packaging-files-dir`

**Type:** `string`

### `packaging-files-config`

**Type:** `object`

### `package-pprint-name`

**Type:** `string`

### `head-as-boolean`

**Type:** `boolean`

### `models-mode`

**Type:** `string`

### `tracing`

**Type:** `boolean`

### `company-name`

**Type:** `string`

### `generate-test`

**Type:** `boolean`

### `debug`

**Type:** `boolean`

### `flavor`

**Type:** `string`

### `examples-dir`

**Type:** `string`

### `enable-typespec-namespace`

**Type:** `boolean`

### `use-pyodide`

**Type:** `boolean`

### `generate-protocol-methods`

**Type:** `boolean`

### `generate-convenience-methods`

**Type:** `boolean`

### `flatten-union-as-enum`

**Type:** `boolean`

### `api-version`

**Type:** `string`

### `examples-directory`

**Type:** `string`

### `emitter-name`

**Type:** `string`

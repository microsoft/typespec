---
title: "Emitter usage"
---

## Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-js
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-js"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-js"
options:
  "@typespec/http-client-js":
    option: value
```

## Emitter options

### `package-version`

**Type:** `string`

The version of the package.

### `package-name`

**Type:** `string`

Name of the package.

### `license`

**Type:** `object`

License information for the generated client code.

---
title: "Emitter usage"
---

## Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-java
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-java"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-java"
options:
  "@typespec/http-client-java":
    option: value
```

## Emitter options

### `license`

**Type:** `object`

License information for the generated client code.

### `dev-options`

**Type:** `object`

Developer options for http-client-java emitter.

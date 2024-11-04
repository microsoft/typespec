---
title: "Emitter usage"
toc_min_heading_level: 2
toc_max_heading_level: 3
---



## Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-server-javascript
```

2. Via the config

```yaml
emit:
  - "@typespec/http-server-javascript"
```

## Emitter options

### `features`

**Type:** `object`

### `omit-unreachable-types`

**Type:** `boolean`

### `no-format`

**Type:** `boolean`

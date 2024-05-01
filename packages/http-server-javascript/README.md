# @typespec/http-server-javascript

TypeSpec HTTP server code generator for JavaScript

## Install

```bash
npm install @typespec/http-server-javascript
```

## Emitter

### Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-server-javascript
```

2. Via the config

```yaml
emit:
  - "@typespec/http-server-javascript"
```

### Emitter options

#### `features`

**Type:** `object`

#### `omit-unreachable-types`

**Type:** `boolean`

#### `no-format`

**Type:** `boolean`

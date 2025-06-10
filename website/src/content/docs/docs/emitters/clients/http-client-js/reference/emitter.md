---
title: "Emitter usage"
---

## Emitter usage

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

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/http-client-js`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `package-name`

**Type:** `string`

Name of the package as it will be in package.json

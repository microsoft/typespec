# @typespec/http-client-python

TypeSpec emitter for Python SDKs

## Install

```bash
npm install @typespec/http-client-python
```

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

Specifies the directory where the emitter will look for example files. If the flag isn’t set, the emitter defaults to using an `examples` directory located at the project root.

### `enable-typespec-namespace`

**Type:** `boolean`

### `use-pyodide`

**Type:** `boolean`

### `emitter-name`

**Type:** `string`

Set `emitter-name` to output TCGC code models for specific language's emitter. This flag only work for taking TCGC as an emitter.

### `generate-protocol-methods`

**Type:** `boolean`

When set to `true`, the emitter will generate low-level protocol methods for each service operation if `@protocolAPI` is not set for an operation. Default value is `true`.

### `generate-convenience-methods`

**Type:** `boolean`

When set to `true`, the emitter will generate low-level protocol methods for each service operation if `@convenientAPI` is not set for an operation. Default value is `true`.

### `flatten-union-as-enum`

**Type:** `boolean`

### `namespace`

**Type:** `string`

Specifies the namespace you want to override for namespaces set in the spec. With this config, all namespace for the spec types will default to it.

### `api-version`

**Type:** `string`

Use this flag if you would like to generate the sdk only for a specific version. Default value is the latest version. Also accepts values `latest` and `all`.

### `license`

**Type:** `object`

License information for the generated client code.

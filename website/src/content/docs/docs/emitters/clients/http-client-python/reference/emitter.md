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

The version of the package.

### `package-name`

**Type:** `string`

### `generate-packaging-files`

**Type:** `boolean`

Whether to generate packaging files. Packaging files refer to the `setup.py`, `README`, and other files that are needed to package your code.

### `packaging-files-dir`

**Type:** `string`

If you are using a custom packaging files directory, you can specify it here. We won't generate with the default packaging files we have.

### `packaging-files-config`

**Type:** `object`

If you are using a custom packaging files directory, and have additional configuration parameters you want to pass in during generation, you can specify it here. Only applicable if `packaging-files-dir` is set.

### `package-pprint-name`

**Type:** `string`

The name of the package to be used in pretty-printing. Will be the name of the package in `README` and pprinting of `setup.py`.

### `head-as-boolean`

**Type:** `boolean`

Whether to return responses from HEAD requests as boolean. Defaults to `true`.

### `models-mode`

**Type:** `"dpg" | "none"`

What kind of models to generate. If you pass in `none`, we won't generate models. `dpg` models are the default models we generate.

### `company-name`

**Type:** `string`

The name of the company. This will be reflected in your license files and documentation.

### `use-pyodide`

**Type:** `boolean`

Whether to generate using `pyodide` instead of `python`. If there is no python installed on your device, we will default to using pyodide to generate the code.

### `flavor`

**Type:** `string`

The flavor of the SDK.

### `generate-test`

**Type:** `boolean`

Whether to generate test files, for basic testing of your generated sdks. Defaults to `false`.

### `enable-typespec-namespace`

**Type:** `boolean`

Whether the generated package namespace will respec the typespec namespace. Defaults to `true`, which is the suggested value. Use `false` to continue with legacy handling of namespace following `package-name`.

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

### `examples-dir`

**Type:** `string`

Specifies the directory where the emitter will look for example files. If the flag isn’t set, the emitter defaults to using an `examples` directory located at the project root.

### `namespace`

**Type:** `string`

Specifies the namespace you want to override for namespaces set in the spec. With this config, all namespace for the spec types will default to it.

### `api-version`

**Type:** `string`

Use this flag if you would like to generate the sdk only for a specific version. Default value is the latest version. Also accepts values `latest` and `all`.

### `license`

**Type:** `object`

License information for the generated client code.

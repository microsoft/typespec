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

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/http-client-python`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `api-version`

**Type:** `string`

Use this flag if you would like to generate the sdk only for a specific version. Default value is the latest version. Also accepts values `latest` and `all`.

### `license`

**Type:** `object`

License information for the generated client code.

### `package-version`

**Type:** `string`

The version of the package.

### `package-name`

**Type:** `string`

The name of the package.

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

### `use-pyodide`

**Type:** `boolean`

Whether to generate using `pyodide` instead of `python`. If there is no python installed on your device, we will default to using pyodide to generate the code.

### `validate-versioning`

**Type:** `boolean`

Whether to validate the versioning of the package. Defaults to `true`. If set to `false`, we will not validate the versioning of the package.

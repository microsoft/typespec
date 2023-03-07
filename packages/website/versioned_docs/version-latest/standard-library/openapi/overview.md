---
title: Overview
---

# The OpenAPI v3 emitter

TypeSpec has an OpenAPI emitter called `@typespec/openapi3` that emits a standard OpenAPI v3 description from TypeSpec source.
This can then be used as input in to any OpenAPI tooling.

## Install

In your TypeSpec project root

```bash
npm install @typespec/openapi3
```

The OpenAPI emitter requires certain features of the TypeSpec HTTP library in the `@typespec/rest` package, so this also
needs to be installed and imported somewhere in your TypeSpec source.

```bash
npm install @typespec/rest
```

## Usage

There are several ways to emit an OpenAPI 3.0 definition for your TypeSpec source file.

1. Via the command line

```bash
tsp compile . --emit @typespec/openapi3
```

2. Via the config

Add the following to the `tspconfig.yaml` file.

```yaml
emitters:
  @typespec/openapi3: true
```

This will generate the OpenAPI 3.0 definition every time you compile:

```bash
tsp compile .
```

### Emitter options

Emitter options can be passed on the command line with

```bash
--option "@typespec/openapi3.<optionName>=<value>"

# For example
--option "@typespec/openapi3.output-file=my-custom-openapi.json"
```

or configured via the `tspconfig.yaml` configuration:

```yaml
emitters:
  '@typespec/openapi3':
    <optionName>: <value>

# For example
emitters:
  '@typespec/openapi3':
    outputFile: my-custom-openapi.json
```

#### `output-file`

Configure the name of the swagger output file relative to the compiler `output-dir`.

#### `new-line`

Set the newline character for emitting files. Can be either:

- `lf`(Default)
- `crlf`

#### `omit-unreachable-types`

Only include types references via an operation.

## See also

- [TypeSpec Getting Started](https://github.com/microsoft/typespec#getting-started)
- [TypeSpec for the OpenAPI Developer](https://github.com/microsoft/typespec/blob/main/docs/typespec-for-openapi-dev.md)

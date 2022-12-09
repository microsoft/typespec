---
title: Overview
---

# The OpenAPI v3 emitter

Cadl has an OpenAPI emitter called `@cadl-lang/openapi3` that emits a standard OpenAPI v3 description from Cadl source.
This can then be used as input in to any OpenAPI tooling.

## Install

In your Cadl project root

```bash
npm install @cadl-lang/openapi3
```

The OpenAPI emitter requires certain features of the Cadl HTTP library in the `@cadl-lang/rest` package, so this also
needs to be installed and imported somewhere in your Cadl source.

```bash
npm install @cadl-lang/rest
```

## Usage

There are several ways to emit an OpenAPI 3.0 definition for your Cadl source file.

1. Via the command line

```bash
cadl compile . --emit @cadl-lang/openapi3
```

2. Via the config

Add the following to the `cadl-project.yaml` file.

```yaml
emitters:
  @cadl-lang/openapi3: true
```

This will generate the OpenAPI 3.0 definition every time you compile:

```bash
cadl compile .
```

### Emitter options

Emitter options can be passed on the command line with

```bash
--option "@cadl-lang/openapi3.<optionName>=<value>"

# For example
--option "@cadl-lang/openapi3.output-file=my-custom-openapi.json"
```

or configured via the `cadl-project.yaml` configuration:

```yaml
emitters:
  '@cadl-lang/openapi3':
    <optionName>: <value>

# For example
emitters:
  '@cadl-lang/openapi3':
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

- [Cadl Getting Started](https://github.com/microsoft/cadl#getting-started)
- [Cadl for the OpenAPI Developer](https://github.com/microsoft/cadl/blob/main/docs/cadl-for-openapi-dev.md)

# @typespec/http-client-py

TypeSpec emitter for Python HTTP client libraries, built on `@alloy-js/python` and
`@typespec/emitter-framework`.

> Status: **experimental**. This package is a Phase-1 scaffold. It generates the
> Python package layout, models, enums, type aliases, and a body-less client class.
> HTTP request/response bodies, serialization, authentication, paging, and long-running
> operations are intentionally deferred to follow-up work.
>
> If you need a feature-complete Python emitter today, use
> [`@typespec/http-client-python`](../http-client-python/README.md). This package is a
> from-scratch reimagining using the modern alloy + emitter-framework authoring model.

## Install

```bash
npm install @typespec/http-client-py
```

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-py
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-py"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-py"
options:
  "@typespec/http-client-py":
    package-name: "my-service"
    package-version: "1.0.0"
    flavor: unbranded
    generate-sync: true
    generate-async: true
```

## Emitter options

### `package-name`

**Type:** `string` (default: `"test-package"`)

Name of the generated Python distribution as it will appear in `pyproject.toml`.

### `package-version`

**Type:** `string` (default: `"1.0.0"`)

Version of the generated Python distribution.

### `flavor`

**Type:** `"unbranded" | "azure"` (default: `"unbranded"`)

Selects the underlying runtime. `unbranded` targets `corehttp`; `azure` targets
`azure.core`. The `azure` flavor is reserved for future ARM/azure-core specific
behavior and currently behaves the same as `unbranded`.

### `generate-sync`

**Type:** `boolean` (default: `true`)

Whether to emit synchronous client modules.

### `generate-async`

**Type:** `boolean` (default: `true`)

Whether to emit asynchronous client modules (under `aio/`).

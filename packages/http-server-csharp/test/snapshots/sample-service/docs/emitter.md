---
title: "Emitter usage"
---

# Emitter Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-server-csharp
```

2. Via the config

```yaml
emit:
  - "@typespec/http-server-csharp"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-server-csharp"
options:
  "@typespec/http-server-csharp":
    option: value
```

## Emitter options

### `skip-format`

**Type:** `boolean`

Skips formatting of generated C# Types. By default, C# files are formatted using 'dotnet format'.

### `output-type`

**Type:** `"models" | "all"`

Chooses which service artifacts to emit. choices include 'models' or 'all' artifacts.

### `emit-mocks`

**Type:** `"mocks-and-project-files" | "mocks-only" | "none"`

Emits mock implementations of business logic, setup code, and project files enabling the service to respond to requests before a real implementation is provided

### `use-swaggerui`

**Type:** `boolean`

Configure a Swagger UI endpoint in the development configuration

### `openapi-path`

**Type:** `string`

Use openapi at the given path for generating SwaggerUI endpoints. By default, this will be 'openapi/openapi.yaml' if the 'use-swaggerui' option is enabled.

### `overwrite`

**Type:** `boolean`

When generating mock files, setup code, and project files overwrite any existing files with the same name.

### `project-name`

**Type:** `string`

The name of the generated project.

### `http-port`

**Type:** `number`

The service http port when hosting the project locally.

### `https-port`

**Type:** `number`

The service https port when hosting the project locally.

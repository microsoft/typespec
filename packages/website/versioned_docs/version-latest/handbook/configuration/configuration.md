---
title: Configuration
---

# Compiler and Libraries configurations

TypeSpec compiler and libraries can be configured either via a [configuration file](#configuration-file) or [command line flags](#command-line-flags).

## Configuration file

TypeSpec configuration can be provided via the `tspconfig.yaml` configuration file.

### Discovery

TypeSpec compiler will look for the closest `tspconfig.yaml` file located in the same directory or closest parent directory from the typespec entrypoint.

For example if running `tsp compile /dev/foo/bar/main.tsp`, the compiler will lookup the file at the folllowing paths(In this order):

- `/dev/foo/bar/tspconfig.yaml`
- `/dev/foo/tspconfig.yaml`
- `/dev/tspconfig.yaml`
- `/tspconfig.yaml`

### Schema

The file is a `yaml` document with the following structure. See the [next section](#typespec-configuration-options) for details on each option.

```typespec
model TypeSpecProjectSchema {
  extends?: string;
  parameters?: Record<{default: string}>
  "environment-variables"?: Record<{default: string}>
  "warn-as-error"?: boolean;
  "output-dir"?: boolean;
  "trace"?: string | string[];
  imports?: string;
  emit?: string[];
  options?: Record<unknown>;
  linter?: LinterConfig;
}

model LinterConfig {
  extends?: RuleRef[];
  enable?: Record<RuleRef, boolean>;
  disable?: Record<RuleRef, string>;
}
```

### Extending project files

There is cases where you might want to build different folders with different options(for example different emitters) but want to share some configuration for both as well.

For that you can use the `extends` property of the configuration file

in `<my-pkg>/tspconfig.yaml`

```yaml
options:
  emitter1:
    some-option: my-name
  emitter2:
    some-other-option: This is a title
```

in `<my-pkg>/proj2/tspconfig.yaml`, enable `emitter1` using the options specified in the parent `tspconfig.yaml`

```yaml
extends: ../tspconfig.yaml
emit:
  - emitter1
```

### Variable interpolation

The typespec project file provide variable interpolation using:

- built-in variables
- environment variables
- config file parameters
- emitter options can reference each other

Variable interpolation is done using an variable expression surrounded by `{` and `}`. (`{<expression>}`)

Examples:

- `{output-dir}/my-path`
- `{env.SHARED_PATH}/my-path`

### Emitter path config interpolation

Some config of emitters can be interpolated using a special rule that will collapse a path.

If a variable is followed by a `/` or `.` and the emitter interpolating the config doesn't provide that variable it will then omit the path segment.

For example given the following config value: `{service-name}/output.{version}.json`
The following would get produced

| Service name value | Version value | Result                    |
| ------------------ | ------------- | ------------------------- |
| `"PetStore"`       | `"v1"`        | `PetStore/output.v1.json` |
| `"PetStore"`       | `undefined`   | `PetStore/output.json`    |
| `undefined`        | `"v1"`        | `output.v1.json`          |
| `undefined`        | `undefined`   | `output.json`             |

#### Built-in variables

| Variable name  | Scope           | Description                                                                          |
| -------------- | --------------- | ------------------------------------------------------------------------------------ |
| `cwd`          | \*              | Points to the current working directory                                              |
| `project-root` | \*              | Points to the the tspconfig.yaml file containing folder.                             |
| `output-dir`   | emitter options | Common `output-dir` See [output-dir](#output-dir---configure-the-default-output-dir) |
| `emitter-name` | emitter options | Name of the emitter                                                                  |

#### Project parameters

A typespec project file can specify some parameters that can then be specified via the CLI.

`{cwd}` and `{project-root}` variables can be used in the default value of those parmeters.

The parameters can then be referenced by their name in a variable interpolation expression.

Parameters must have a default value.
**Example:**

```yaml
parameters:
  base-dir:
    default: "{cwd}"

output-dir: {base-dir}/output
```

The parameter can then be specified with `--arg` in this format `--arg "<parameter-name>=<value>"`

```bash
tsp compile . --arg "base-dir=/path/to/base"
```

#### Environment variables

A typespec project file can define which environment variables it can interpolate.

`{cwd}` and `{project-root}` variables can be used in the default value of the environment variables.

The environment variables can then be referenced by their name in a variable interpolation expression with the `env.` prefix.

Environment variables must have a default value.

**Example:**

```yaml
environment-variables:
  BASE_DIR:
    default: "{cwd}"

output-dir: {env.BASE_DIR}/output
```

#### Emitter options

Emitter options can reference each other using the other option name as the variable expresion.

Can only interpolate emitter options from the same emitter.

```yaml
options:
  @typespec/openapi3:
    emitter-output-dir: {output-dir}/{emitter-sub-folder}
    emitter-sub-folder: bar

```

## TypeSpec Configuration Options

| Config          | Cli                       | Description                                              |
| --------------- | ------------------------- | -------------------------------------------------------- |
| `output-dir`    | `--output-dir`            | Default output directory                                 |
| `config`        | `--config`                | Path to config file or folder to search for config file. |
| `trace`         | `--trace`                 | Specify tracing area to enable                           |
| `warn-as-error` | `--warn-as-error`         | Treat warning as error                                   |
| `imports`       | `--import`                | Additional imports to include                            |
| `emit`          | `--emit`                  | Emitter configuration                                    |
| `options`       | `--option` or `--options` | Emitter configuration                                    |
| `linter`        |                           | Linter configuration                                     |

### `output-dir` - Configure the default output dir

Specify the common output-dir for all emitters. See [this](#output-directory-configuration) to configure per emitter.

```yaml
output-dir: {cwd}/typespec-build
```

Output dir can be provided using the `--output-dir` cli flag

```bash
tsp compile . --output-dir "./typespec-build"
```

Output dir must be an absolute path in the config. Use `{cwd}` or `{project-root}` to explicitly specify what it should be relative to.

See [output directory configuration for mode details](#output-directory-configuration)

### `trace` - Configure what to trace

Configure what area to trace. See [tracing docs](./tracing.md)

```yaml
# Trace all.
trace: *

# or specific areas
trace:
  - import-resolution
  - projection
```

Trace can be provided using the `--trace` cli flag

```bash
tsp compile . --trace import-resolution --trace projection
```

### `warn-as-error` - Treat warning as error

All warnings will be emitted as error. Result in a non zero exit code in case of warning.

**This is recommended to use in CI to prevent warning from being unadressed.**

```yaml
warn-as-error: true
```

or via the cli

```bash
tsp compile . --warn-as-error
```

### `--ignore-deprecated`

Suppress all `deprecated` diagnostics that are raised when declarations are marked with the `#deprecated` directive.

```yaml
tsp compile . --ignore-deprecated
```

### `imports` - Configure additional imports

```yaml
imports:
  - sidecar.tsp
```

Specify additional typespec files to import

```bash
tsp compile . --import "sidecar.tsp"
```

### `emit` - Specifying which emitters to run

Specify which emitters to use and their options if applicable.

The value can be the name of an emitter or a path to the emitter package/entrypoint.

```yaml
emit:
  - emitter1 # Package name
  - /path/to/emitter2 # Give a path to an emitter
```

or via the cli

```bash
tsp compile . --emit emitter1 --emit /path/to/emitter2
```

### `options` - Configuring emitters

Emitters can define a set of options, those can be set as the value of the map.

```yaml
options:
  # Enable and configure emitter1
  emitter1:
    option1: "option1-value"
    option2: "option1-value"
  # Only enable emitter2
  emitter2: true
```

Emitters options can also be provided using the `--option` in this format `--option=<emitterName>.<optionName>=<value>`

```bash

tsp compile . --option "emitter1.option1=option1-value"
```

Options specified via the CLI take precedence over the ones specified in `tspconfig.yaml`.

#### Emitters built-in options

##### `emitter-output-dir`

Represent the path where the emitter should be outputing the generated files.

Default: `{output-dir}/{emitter-name}`

See [output directory configuration for mode details](#output-directory-configuration)

### `linter` - Configuring linters

Configure which linter rules should be enabled in this repository. Referencing to a rule or ruleset must be using their id which is in this format `<libraryName>:<ruleName>`

```yaml
linter:
  extends: # Extend `recommended` ruleset from @typespec/best-practices library
    - "@typespec/best-practices/recommended"

  enable: # Explicitly enable some rules
    "@typespec/best-practices/no-x": true

  disable: # Disable some rules defined in one of the ruleset extended.
    "@typespec/best-practices/no-y": "This rule cannot be applied in this project because X"
```

## Emitter control cli flags

### `--no-emit`

Disable emitting. If emitters are still specified it will still run the emitter but emitters shouldn't be writing anything to disk.

Can also be used to hide the "There is no emitters warning".

```yaml
tsp compile . --no-emit
```

## Other Command line flags

### `--config`

Specify a different config file

```bash
tsp compile . --config ./tspconfig.alt.yaml
```

### `--watch`

Start the tsp compiler in watch mode: watch for file changes and compile on save.

```bash
tsp compile . --watch
```

:::caution
Known issue: the watch mode does not pickup changes in JS files that are indirectly included(Only imported via another JS file.)
:::

### `--nostdlib`

Don't load the TypeSpec standard library.

```bash
tsp compile . --nostdlib
```

### `--version`

Log the version of the tsp compiler.

```bash
tsp compile . --version
```

### `--pretty`

**Default: `true`**

Enable/Disable pretty logging(Colors, diagnostic preview, etc.).

```bash
tsp compile . --pretty=false
```

## Output directory configuration

Typespec compiler will provide a unique output directory for each emitter that is being run to reduce conflicts.
By default the output-dir of an emitter is set to this value:

```
{output-dir}/{emitter-name}
```

where

- `output-dir` is the compiler common `output-dir` that can be configured via `--output-dir`
- `emitter-name` is the name of the emitter package(for example `@typespec/openapi3`)

Example:
Given the following emitters: `@typespec/openapi3` and `@typespec/jsonschema`, the default output folder structure would be

```
{project-root}/tsp-output:
  @typespec:
    openapi3
      ... openapi3 files ...
    jsonschema
      ... json schema files ...
```

Changing the compiler `output-dir` with `--output-dir` or setting that value in the tspconfig.yaml would result in the following structure

```
--output-dir={cwd}/my-custom-output-dir

{cwd}/my-custom-output-dir:
  @typespec:
    openapi3
      ... openapi3 files ...
    jsonschema
      ... json schema files ...

```

Changing a specific emitter output-dir can be done by setting that emitter `emitter-output-dir` option

```
--option "@typespec/openapi3.output-dir={projectroot}/openapispec"

{project-root}
  openapispec:
    ... openapi3 files ...
  tsp-output:
    @typespec:
      jsonschema
        ... json schema files ...
```

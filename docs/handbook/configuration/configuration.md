---
title: Configuration
---

The TypeSpec compiler and libraries can be configured either via a [configuration file](#configuration-file) or command line flags.

## Configuration file

TypeSpec configuration can be provided via the `tspconfig.yaml` configuration file.

### Discovery

The TypeSpec compiler will look for the closest `tspconfig.yaml` file located in the same directory or closest parent directory from the TypeSpec entrypoint.

For example if running `tsp compile /dev/foo/bar/main.tsp`, the compiler will lookup the file at the folllowing paths (in order):

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

### Extending Project Files

There may be instances where you want to build different folders with varying options (such as different emitters), but still want to share some common configurations.

In such cases, you can use the `extends` property in the configuration file.

For instance, in `<my-pkg>/tspconfig.yaml`:

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

The TypeSpec project file provides variable interpolation using:

- built-in variables
- environment variables
- config file parameters
- emitter options can reference each other

Variable interpolation is done using an variable expression surrounded by `{` and `}`. (`{<expression>}`)

Examples:

- `{output-dir}/my-path`
- `{env.SHARED_PATH}/my-path`

### Interpolation of Emitter Path Config

Certain emitter configurations can be interpolated using a specific rule designed to collapse a path.

If a variable is succeeded by a `/` or `.` and the emitter responsible for interpolating the config doesn't supply that variable, the path segment will be omitted.

For instance, consider the following config value: `{service-name}/output.{version}.json`
Here's what would be produced:

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

#### Project Parameters

A TypeSpec project file can define certain parameters that can subsequently be specified through the CLI.
Parameters can be organized in a nested structure, to access different levels of the structure, use dots (`.`) in the variable expression.
Therefore, parameter names should not contain `.` in their name.

The `{cwd}` and `{project-root}` variables can be utilized in the default value of these parameters.

These parameters can then be referred to by their name in a variable interpolation expression.

All parameters must have a default value.
**Example:**

```yaml
parameters:
  base-dir:
    default: "{cwd}"

output-dir: {base-dir}/output
```

The parameter can then be specified via `--arg` in this format `--arg "<parameter-name>=<value>"` and for nested structures `--arg "<parameter-name>.<nested-parameter-name>=<value>"`

```bash
tsp compile . --arg "base-dir=/path/to/base"
```

#### Environment variables

A TypeSpec project file can specify which environment variables it can interpolate.

The `{cwd}` and `{project-root}` variables can be used in the default value of these environment variables.

These environment variables can then be referred to by their name in a variable interpolation expression, using the `env.` prefix.

All environment variables must have a default value.

**Example:**

```yaml
environment-variables:
  BASE_DIR:
    default: "{cwd}"

output-dir: {env.BASE_DIR}/output
```

#### Emitter Options

Emitter options can refer to each other by using the other option's name as the variable expression.

Interpolation is only possible among emitter options from the same emitter.

```yaml
options:
  @typespec/openapi3:
    emitter-output-dir: {output-dir}/{emitter-sub-folder}
    emitter-sub-folder: bar

```

Emitter options support a nested structure, enabling complex configurations.

```yaml
options:
  emitter-sub-folder:
    sub-folder: bar
```

To set these values via the CLI, use dots to navigate deeper levels in the definition. `--option "<option-name>.<nested-option-name>=<value>"`
Due to this capability, emitter option names should not contain a `.` in their name.

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

Specify the common output-dir for all emitters. See [this](#configuring-output-directory) to configure per emitter.

```yaml
output-dir: {cwd}/typespec-build
```

Output dir can be provided using the `--output-dir` cli flag

```bash
tsp compile . --output-dir "./typespec-build"
```

Output dir must be an absolute path in the config. Use `{cwd}` or `{project-root}` to explicitly specify what it should be relative to.

See [output directory configuration for mode details](#configuring-output-directory)

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

### `warn-as-error` - Treating Warnings as Errors

All warnings will be treated and emitted as errors, resulting in a non-zero exit code in the event of a warning.

**It is recommended to use this feature in Continuous Integration (CI) to ensure all warnings are addressed.**

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

Specify additional TypeSpec files to import

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

See [output directory configuration for mode details](#configuring-output-directory)

### `linter` - Setting Up Linters

This allows you to configure the linter rules to be enabled in this repository. When referencing a rule or ruleset, use their ID, which follows the format `<libraryName>:<ruleName>`.

```yaml
linter:
  extends: # Extend `recommended` ruleset from @typespec/best-practices library
    - "@typespec/best-practices/recommended"

  enable: # Explicitly enable some rules
    "@typespec/best-practices/no-x": true

  disable: # Disable some rules defined in one of the ruleset extended.
    "@typespec/best-practices/no-y": "This rule cannot be applied in this project because X"
```

## CLI Flags for Emitter Control

### `--no-emit`

This flag disables emitting. If emitters are still specified, the emitter will run but it should not write anything to the disk.

This flag can also be used to suppress the "There are no emitters" warning.

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
Known issue: the watch mode does not pickup changes in JS files that are indirectly included (only imported via another JS file.)
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

Enable/Disable pretty logging (colors, diagnostic preview, etc.).

```bash
tsp compile . --pretty=false
```

## Configuring Output Directory

The TypeSpec compiler assigns a unique output directory to each emitter that runs, in order to minimize conflicts. By default, the output directory of an emitter is set to:

```
{output-dir}/{emitter-name}
```

where:

- `output-dir` is the common output directory for the compiler, which can be configured via `--output-dir`.
- `emitter-name` is the name of the emitter package (for example, `/openapi3`).

For instance, if the emitters `@typespec/openapi3` and `@typespec/jsonschema` are given, the default output folder structure would be:

```
{project-root}/tsp-output:
  @typespec:
    openapi3
      ... openapi3 files ...
    jsonschema
      ... json schema files ...
```

You can change the compiler's `output-dir` with `--output-dir` or by setting that value in the tspconfig.yaml, which would result in the following structure:

```
--output-dir={cwd}/my-custom-output-dir

{cwd}/my-custom-output-dir:
  @typespec:
    openapi3
      ... openapi3 files ...
    jsonschema
      ... json schema files ...
```

To change a specific emitter's output directory, you can set the `emitter-output-dir` option for that emitter:

```
--option "@typespec/openapi3.output-dir={project-root}/openapispec"

{project-root}
  openapispec:
    ... openapi3 files ...
  tsp-output:
    @typespec:
      jsonschema
        ... json schema files ...
```

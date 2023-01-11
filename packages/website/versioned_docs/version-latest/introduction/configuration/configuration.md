---
title: Configuration
---

# Compiler and Libraries configurations

Cadl compiler and libraries can be configured either via a [configuration file](#configuration-file) or [command line flags](#command-line-flags).

## Configuration file

Cadl configuration can be provided via the `cadl-project.yaml` configuration file.

### Discovery

Cadl compiler will look for the closest `cadl-project.yaml` file located in the same directory or closest parent directory from the cadl entrypoint.

For example if running `cadl compile /dev/foo/bar/main.cadl`, the compiler will lookup the file at the folllowing paths(In this order):

- `/dev/foo/bar/cadl-project.yaml`
- `/dev/foo/cadl-project.yaml`
- `/dev/cadl-project.yaml`
- `/cadl-project.yaml`

### Schema

The file is a `yaml` document with the following structure. See the [next section](#cadl-configuration-options) for details on each option.

```cadl
model CadlProjectSchema {
  extends?: string;
  parameters?: Record<{default: string}>
  "environment-variables"?: Record<{default: string}>
  "warn-as-error"?: boolean;
  "output-dir"?: boolean;
  "trace"?: string | string[];
  imports?: string;
  emit?: string[];
  options?: Record<unknown>;
}
```

### Extending project files

There is cases where you might want to build different folders with different options(for example different emitters) but want to share some configuration for both as well.

For that you can use the `extends` property of the configuration file

in `<my-pkg>/cadl-project.yaml`

```yaml
options:
  emitter1:
    some-option: my-name
  emitter2:
    some-other-option: This is a title
```

in `<my-pkg>/proj2/cadl-project.yaml`, enable `emitter1` using the options specified in the parent `cadl-project.yaml

```yaml
extends: ../cadl-project.yaml
emit:
  - emitter1
```

in `<my-pkg>/cadl-project.yaml`, enable `emitter2` using the options specified in the parent `cadl-project.yaml

```yaml
extends: ../cadl-project.yaml
emit:
  - emitter2
```

### Variable interpolation

The cadl project file provide variable interpolation using:

- built-in variables
- environment variables
- config file parameters
- emitter options can reference each other

Variable interpolation is done using an variable expression surrounded by `{` and `}`. (`{<expression>}`)

Examples:

- `{output-dir}/my-path`
- `{env.SHARED_PATH}/my-path`

#### Built-in variables

| Variable name  | Scope           | Description                                                                          |
| -------------- | --------------- | ------------------------------------------------------------------------------------ |
| `cwd`          | \*              | Points to the current working directory                                              |
| `project-root` | \*              | Points to the the cadl-project.yaml file containing folder.                          |
| `output-dir`   | emitter options | Common `output-dir` See [output-dir](#output-dir---configure-the-default-output-dir) |
| `emitter-name` | emitter options | Name of the emitter                                                                  |

#### Project parameters

A cadl project file can specify some parameters that can then be specified via the CLI.

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
cadl compile . --arg "base-dir=/path/to/base"
```

#### Environment variables

A cadl project file can define which environment variables it can interpolate.

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
  @cadl-lang/openapi3:
    emitter-output-dir: {output-dir}/{emitter-sub-folder}
    emitter-sub-folder: bar

```

## Cadl Configuration Options

| Config          | Cli                       | Description                    |
| --------------- | ------------------------- | ------------------------------ |
| `output-dir`    | `--output-dir`            | Default output directory       |
| `trace`         | `--trace`                 | Specify tracing area to enable |
| `warn-as-error` | `--warn-as-error`         | Treat warning as error         |
| `imports`       | `--import`                | Additional imports to include  |
| `emit`          | `--emit`                  | Emitter configuration          |
| `options`       | `--option` or `--options` | Emitter configuration          |

### `output-dir` - Configure the default output dir

Specify which emitters to use and their options if applicable.

```yaml
output-dir: {cwd}/cadl-build
```

Output dir can be provided using the `--output-dir` cli flag

```bash
cadl compile . --output-dir "./cadl-build"
```

Output dir must be an absolute path in the config. Use `{cwd}` or `{project-root}` to explicitly specify what it should be relative to.

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
cadl compile . --trace import-resolution --trace projection
```

### `warn-as-error` - Treat warning as error

All warnings will be emitted as error. Result in a non zero exit code in case of warning.

**This is recommended to use in CI to prevent warning from being unadressed.**

```yaml
warn-as-error: true
```

or via the cli

```bash
cadl compile . --warn-as-error
```

### `imports` - Configure additional imports

```yaml
imports:
  - sidecar.cadl
```

Specify additional cadl files to import

```bash
cadl compile . --import "sidecar.cadl"
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
cadl compile . --emit emitter1 --emit /path/to/emitter2
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

cadl compile . --option "emitter1.option1=option1-value"
```

Options specified via the CLI take precedence over the ones specified in `cadl-project.yaml`.

#### Emitters built-in options

##### `emitter-output-dir`

Represent the path where the emitter should be outputing the generated files.

Default: `{output-dir}/{emitter-name}`

## Emitter control cli flags

### `--no-emit`

Disable emitting. If emitters are still specified it will still run the emitter but emitters shouldn't be writing anything to disk.

Can also be used to hide the "There is no emitters warning".

```yaml
cadl compile . --no-emit
```

## Other Command line flags

### `--watch`

Start the cadl compiler in watch mode: watch for file changes and compile on save.

```bash
cadl compile . --watch
```

### `--nostdlib`

Don't load the Cadl standard library.

```bash
cadl compile . --nostdlib
```

### `--version`

Log the version of the cadl compiler.

```bash
cadl compile . --version
```

### `--pretty`

**Default: `true`**

Enable/Disable pretty logging(Colors, diagnostic preview, etc.).

```bash
cadl compile . --pretty=false
```

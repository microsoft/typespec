---
id: configuration
title: Configuration
---

# Compiler and Libraries configurations

Cadl compiler and libraries can be configured either via a [configuration file](#configuration-file) or [command line flags](#command-line-flags).

## Configuration file

Cadl configuration can be provided via the `cadl-project.yaml` configuration file.

### Discovery

Cadl compiler will look for the closest `cadl-project.yaml` file located in the same directory or closest parent directory

For example if runnning `cadl compile /dev/foo/bar/main.cadl`, the compiler will lookup the file at the folllowing paths(In this order):

- `/dev/foo/bar/cadl-project.yaml`
- `/dev/foo/cadl-project.yaml`
- `/dev/cadl-project.yaml`
- `/cadl-project.yaml`

### `cadl-project.yaml` schema

```yaml
extends: <relative path to another project>
# Map of the default emitters to use when not using `--emit`
emitters:
  <emitterName>: boolean | Record<string, any>
```

#### `extends` - Extending project files

There is cases where you might want to build different folders with different options(for example different emitters) but want to share some configuration for both as well.

For that you can use the `extends` property of the configuration file

in `<mypkg>/cadl-project.yaml`

```yaml
emitters:
  emitter1: true
```

in `<mypkg>/proj2/cadl-project.yaml`, enable `emitter1` and `emitter2`

```yaml
extends: ../cadl-project.yaml
emitters:
  emitter2: true
```

in `<mypkg>/cadl-project.yaml`, enable `emitter1` and `emitter3`

```yaml
extends: ../cadl-project.yaml
emitters:
  emitter3: true
```

#### `emitters` - Configuring emitters

Specify which emitters to use and their options if applicable.

```yaml
emitters:
  emitter1: true
  emitter2: true
```

Emitters can define a set of options, those can be set as the value of the map.

```yaml
emitters:
  # Enable and configure emitter1
  emitter1:
    option1: "option1-value"
    option2: "option1-value"
  # Only enable emitter2
  emitter2: true
```

Emitters options can also be provided using the `--option` [flag](#option)

Emitters selection can be overridden in the command line via `--emit` [flag](#emit).

## Command line flags

### `--emit`

Select which emitters to use. If there are options in the cadl-project.yaml it will still use those.

```yaml
cadl compile . --emit emitter1
```

### `--no-emit`

Disable emitting. If emitters are still specified it will still run the emitter but emitters shouldn't be writting anything to disk.

Can also be used to hide the "There is no emitters warning".

```yaml
cadl compile . --no-emit
```

### `--option`

Specify emitters options in this format`--option=<emitterName>.<optionName>=<value>`

```bash
cadl compile . --option "emitter1.option1=option1-value"
```

Options specified via the CLI take precedence over the ones specified in `cadl-project.yaml`.

### `--import`

Specify additional cadl files to import

```bash
cadl compile . --import "sidecar.cadl"
```

### `--watch`

Start the cadl compiler in watch mode: watch for file changes and compile on save.

```bash
cadl compile . --watch
```

## `--nostdlib`

Don't load the Cadl standard library.

```bash
cadl compile . --nostdlib
```

## `--version`

Log the version of the cadl compiler.

```bash
cadl compile . --version
```

## `--pretty`

**Default: `true`**

Enable/Disable pretty logging(Colors, diagnostic preview, etc.).

```bash
cadl compile . --pretty=false
```

## `--warn-as-error`

All warnings will be emitted as error. Result in a non zero exit code in case of warning.

**This is recommended to use in CI to prevent warning from being unadressed.**

```bash
cadl compile . --warn-as-error
```

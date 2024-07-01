# @typespec/service-generator-csharp

TypeSpec service code generator for c-sharp

## Install

```bash
npm install @typespec/service-generator-csharp
```

## Emitter

### Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/service-generator-csharp
```

2. Via the config

```yaml
emit:
  - "@typespec/service-generator-csharp"
```

### Emitter options

#### `skip-format`

**Type:** `boolean`

Skips formatting of generated C# Types. By default, C# files are formatted using 'dotnet format'.

#### `output-type`

**Type:** `"models" | "all"`

Chooses which service artifacts to emit. choices include 'models' or 'all' artifacts.

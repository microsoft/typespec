# @typespec/http-client-csharp

TypeSpec library for emitting Http Client libraries for C#.

## Install

```bash
npm install @typespec/http-client-csharp
```

## Usage

### Prerequisite

- Install [Node.js](https://nodejs.org/download/) 20 or above. (Verify by running `node --version`)
- Install [**.NET 8.0 SDK**](https://dotnet.microsoft.com/download/dotnet/8.0) for your specific platform. (or a higher version)

### Customizing Generated Code

For detailed instructions on how to customize the generated C# code, see the [Customization Guide](https://github.com/microsoft/typespec/blob/main/packages/http-client-csharp/.tspd/docs/customization.md).

### Experimental types and members

Use `TypeSpec.HttpClient.@experimental` to assign a public diagnostic ID to a generated
type or member and identify experiments used by its implementation:

```typespec
import "@typespec/http-client";

@TypeSpec.HttpClient.experimental(#{
  emitterScope: "@typespec/http-client-csharp",
  diagnosticId: "C",
  dependsOn: #["A", "B"],
})
op bar(): void;
```

The C# emitter adds `[Experimental("C")]` to the corresponding generated declaration:

| TypeSpec target                                       | Generated C# target                                           |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| Model                                                 | Model class or struct                                         |
| Model property                                        | Property                                                      |
| Enum or union emitted as an enum                      | Enum or extensible-enum struct                                |
| Enum member or union variant emitted as an enum value | Enum field or extensible-enum property                        |
| Operation                                             | Synchronous and asynchronous protocol and convenience methods |
| Namespace or interface emitted as a client            | Client class                                                  |

For example, models and their properties can be separate experiments:

```typespec
@TypeSpec.HttpClient.experimental(#{ diagnosticId: "MODEL001" })
model Preview {
  @TypeSpec.HttpClient.experimental(#{ diagnosticId: "PROPERTY001" })
  value?: string;
}
```

Model factory methods expose the model's diagnostic. Partial serialization declarations
do not repeat the model attribute. Generated code suppresses diagnostics when referring
to source-annotated experimental types and members, so serialization, factories, and client
implementations can compile without changing the experimental status of other public APIs.

For operation dependencies, suppressions surround each method declaration and body.
For type/member dependencies and generated references to experimental declarations,
suppressions are scoped to the generated file. Both include parameter and return types,
generic arguments, and implementation references; neither suppresses diagnostics in
consumer code.

Dependencies identify diagnostics rather than individual types: one diagnostic can apply
to multiple types or members, including those defined in external libraries. External
experiments still require explicit `dependsOn` entries; they are not discovered by reflection.

Both metadata fields are optional. Without `diagnosticId`, no public experimental attribute
is added. Without `dependsOn`, no additional dependency diagnostics are requested; generated
references to source-annotated experiments are still handled. Emitter scopes apply to both fields.

Some TypeSpec declarations have no corresponding C# declaration, such as scalars or unions
mapped to built-in C# types. C# also does not allow `ExperimentalAttribute` on parameters.
The emitter reports `experimental-target-not-supported` for these annotations instead of
silently dropping them or assigning their diagnostic to an unrelated API.

Graduation is an explicit source change: dependencies becoming generally available, or
removing entries from `dependsOn`, does not remove `[Experimental("C")]`. Remove the
declaration's `@experimental` decorator when the public API is ready to graduate.

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-csharp
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-csharp"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-csharp"
options:
  "@typespec/http-client-csharp":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/http-client-csharp`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `api-version`

**Type:** `string | object`

Use this flag if you would like to generate the sdk only for a specific version. Default value is the latest version. Also accepts values `latest` and `all`. For multi-service packages, provide a map from each service namespace to its desired version. Nested namespaces must be represented as nested objects in `tspconfig.yaml`; services not listed default to their latest version.

**Options:**

- `string`
- `object`

### `generate-protocol-methods`

**Type:** `boolean`

Set to `false` to skip generation of protocol methods. The default value is `true`.

### `generate-convenience-methods`

**Type:** `boolean`

Set to `false` to skip generation of convenience methods. The default value is `true`.

### `unreferenced-types-handling`

**Type:** `"removeOrInternalize" | "internalize" | "keepAll"`

Defines the strategy on how to handle unreferenced types. The default value is `removeOrInternalize`.

### `new-project`

**Type:** `boolean`

Set to `true` to overwrite the csproj if it already exists. The default value is `false`.

### `save-inputs`

**Type:** `boolean`

Set to `true` to save the `tspCodeModel.json` and `Configuration.json` files that are emitted and used as inputs to the generator. The default value is `false`.

### `package-name`

**Type:** `string`

Define the package name. If not specified, the first namespace defined in the TypeSpec is used as the package name.

### `debug`

**Type:** `boolean`

Set to `true` to automatically attempt to attach to a debugger when executing the C# generator. The default value is `false`.

### `logLevel`

**Type:** `"info" | "debug" | "verbose"`

Set the log level for which to collect traces. The default value is `info`.

### `disable-xml-docs`

**Type:** `boolean`

Set to `true` to disable XML documentation generation. The default value is `false`.

### `disable-roslyn-reduce`

**Type:** `boolean`

Set to `true` to skip the Roslyn reduce (simplification) post-processing step. This speeds up generation and is useful when iterating quickly. The default value is `false`.

### `generator-name`

**Type:** `string`

The name of the generator. By default this is set to `ScmCodeModelGenerator`. Generator authors can set this to the name of a generator that inherits from `ScmCodeModelGenerator`.

### `emitter-extension-path`

**Type:** `string`

Allows emitter authors to specify the path to a custom emitter package, allowing you to extend the emitter behavior. This should be set to `import.meta.url` if you are using a custom emitter.

### `plugins`

**Type:** `string[]`

Paths to generator plugin assemblies (DLLs) or directories containing plugin assemblies. Each plugin must contain a class that extends `GeneratorPlugin`. Paths may be absolute or relative to the resolved `emitter-output-dir`. For example, to load plugins that live in a `codegen` folder under the output directory:

```yaml
options:
  "@typespec/http-client-csharp":
    plugins:
      - "codegen/MyPlugin.dll" # file relative to emitter-output-dir
      - "codegen" # directory containing plugin assemblies
      - "/abs/path/to/MyPlugin.dll" # absolute path used as-is
```

### `license`

**Type:** `object { name, company, link, header, description }`

License information for the generated client code.

**Properties:**

| Name          | Type     | Default | Description |
| ------------- | -------- | ------- | ----------- |
| `name`        | `string` |         |             |
| `company`     | `string` |         |             |
| `link`        | `string` |         |             |
| `header`      | `string` |         |             |
| `description` | `string` |         |             |

### `sdk-context-options`

**Type:** `object`

The SDK context options that implement the `CreateSdkContextOptions` interface from the [`@azure-tools/typespec-client-generator-core`](https://www.npmjs.com/package/@azure-tools/typespec-client-generator-core) package to be used by the CSharp emitter.

## Decorators

### TypeSpec.HttpClient.CSharp

- [`@dynamicModel`](#@dynamicmodel)

#### `@dynamicModel`

Marks a model or namespace as dynamic, indicating it should generate dynamic model code.
Can be applied to Model or Namespace types.

```typespec
@TypeSpec.HttpClient.CSharp.dynamicModel
```

##### Target

`Model | Namespace`

##### Parameters

None

##### Examples

```tsp
@dynamicModel
model Pet {
  name: string;
  kind: string;
}

@dynamicModel
namespace PetStore {
  model Dog extends Pet {
    breed: string;
  }
}
```

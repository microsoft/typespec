# TypeSpec csharp emitter library

This is a TypeSpec library that will emit a .NET SDK from TypeSpec.

## Prerequisite

Install [Node.js](https://nodejs.org/download/) 16 or above. (Verify by `node --version`)
Install [**.NET 8.0 SDK**](https://dotnet.microsoft.com/download/dotnet/8.0) for your specific platform. (or a higher version)

## Getting started

### Initialize TypeSpec Project

Follow [TypeSpec Getting Started](https://github.com/microsoft/typespec/#using-node--npm) to initialize your TypeSpec project.

Make sure `npx tsp compile .` runs correctly.

### Add typespec csharp

Run `npm install @typespec/http-client-csharp`.

### Generate .NET client

Run command `npx tsp compile --emit @typespec/http-client-csharp <path-to-typespec-file>`

e.g.

```cmd
npx tsp compile main.tsp --emit @typespec/http-client-csharp
```

## Configuration

You can further configure the SDK generated, using the emitter options on @typespec/http-client-csharp.

You can set options in the command line directly via `--option @typespec/http-client-csharp.<optionName>=XXX`, e.g. `--option @typespec/http-client-csharp.package-name=MyService`

or

Modify `tspconfig.yaml` in typespec project, add emitter options under options/@typespec/http-client-csharp.

```diff
emit:
  - "@typespec/http-client-csharp"
options:
  "@typespec/http-client-csharp":
+    package-name: MyService
```

**Supported Emitter options**:

- `package-name` define the package name. If not specified, the first namespace defined in the TypeSpec is used as the package name.
- `emitter-output-dir` define the output directory path which will store the generated code. If not specified, the `tsp-output` directory is used.
- `generate-protocol-methods` indicate if you want to generate a **protocol method** for every operation or not. The default value is `true`.
- `generate-convenience-methods` indicate if you want to generate a **convenience method** for every operation or not. The default value is `true`.
- `disable-xml-docs` set to `true` to not generate XML docs in the generated library. The default value is `false`.
- `api-version` for TypeSpec files using the [`@versioned`](https://typespec.io/docs/libraries/versioning/reference/decorators/#@TypeSpec.Versioning.versioned) decorator, set to the version that should be used to generate against.
- `unreferenced-types-handling` define the strategy how to handle unreferenced types. It can be `removeOrInternalize`, `internalize` or `keepAll`. The default value is `removeOrInternalize`.
- `clear-output-folder` indicate if you want to clear up the output folder before generating. The default value is `true`.
- `new-project` set to `true` to overwrite the csproj if it already exists. The default value is `false`.
- `save-inputs` set to `true` to save the `tspCodeModel.json` and `Configuration.json` files that are emitted and used as inputs to the C# generator. The default value is `false`.
- `debug` set to `true` to automatically attempt to attach to a debugger when executing the C# generator. The default value is `false`.
- `generator-name` by default this is set to `ScmCodeModelGenerator`. Generator authors can set this to the name of a generator that inherits from `ScmCodeModelGenerator`.

## Convenience API

By default, TypeSpec csharp generates all protocol APIs and convenience APIs.
A few exceptions are API of JSON Merge Patch, and API of long-running operation with ambiguous response type.

You can configure whether to generate a convenience method for a specific operation via the `convenienceAPI` decorator.

## Spector Tests

We run the generator against the common set of test defined in https://github.com/microsoft/typespec/tree/main/packages/http-specs.
For details on how to run and debug these tests see [Spector Testing](generator/docs/spector.md).

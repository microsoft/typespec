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

You can set options in the command line directly via `--option @typespec/http-client-csharp.<optionName>=XXX`, e.g. `--option @typespec/http-client-csharp.namespace=MyService.Namespace`

or

Modify `tspconfig.yaml` in typespec project, add emitter options under options/@typespec/http-client-csharp.

```diff
emit:
  - "@typespec/http-client-csharp"
options:
  "@typespec/http-client-csharp":
+    namespace: MyService.Namespace
```

**Supported Emitter options**:

- `namespace` define the client library namespace. e.g. MyService.Namespace.
- `emitter-output-dir` define the output dire path which will store the generated code.
- `generate-protocol-methods` indicate if you want to generate **protocol method** for every operation or not. The default value is true.
- `generate-convenience-methods` indicate if you want to generate **convenience method** for every operation or not. The default value is true.
- `unreferenced-types-handling` define the strategy how to handle the unreferenced types. It can be `removeOrInternalize`, `internalize` or `keepAll`
- `model-namespace` indicate if we want to put the models in their own namespace which is a sub namespace of the client library namespace plus ".Models". if it is set `false`, the models will be put in the same namespace of the client. The default value is `true`.
- `clear-output-folder` indicate if you want to clear up the output folder.
- `package-name` define the package name.

## Convenience API

By default, TypeSpec csharp generates all protocol APIs and convenience APIs.
A few exceptions are API of JSON Merge Patch, and API of long-running operation with ambiguous response type.

You can configure whether generate convenience API or not via `convenienceAPI` decorator.

## CadlRanch Tests

We run the generator against the common set of test defined in https://github.com/Azure/cadl-ranch/tree/main/packages/cadl-ranch-specs.
For details on how to run and debug these tests see [CadlRanch Testing](generator/docs/cadl-ranch.md)

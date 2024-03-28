# TypeSpec csharp emitter library

This is a TypeSpec library that will emit a .NET SDK from TypeSpec.

## Prerequisite

Install [Node.js](https://nodejs.org/en/download/) 16 or above. (Verify by `node --version`)
Install **.NET 6.0 SDK** for your specific platform. (or a higher version)
## Getting started

### Initialize TypeSpec Project

Follow [TypeSpec Getting Started](https://github.com/microsoft/typespec/#using-node--npm) to initialize your TypeSpec project.

Make sure `npx tsp compile .` runs correctly.

### Add typespec-csharp

Include @azure-tools/typespec-csharp dependencies in `package.json`

```diff
 "dependencies": {
+      "@azure-tools/typespec-csharp": "latest"
  },
```

Run `npm install` to install the dependency

### Generate .NET SDK

Run command `npx tsp compile --emit @azure-tools/typespec-csharp <path-to-typespec-file>`

e.g.

```cmd
npx tsp compile main.tsp --emit @azure-tools/typespec-csharp
```

or

```cmd
npx tsp compile client.tsp --emit @azure-tools/typespec-csharp
```

## Configuration

You can further configure the SDK generated, using the emitter options on @azure-tools/typespec-csharp.

You can set options in the command line directly via `--option @azure-tools/typespec-csharp.<optionName>=XXX`, e.g. `--option @azure-tools/typespec-csharp.namespace=azure.AI.DeviceUpdate`

or

Modify `tspconfig.yaml` in typespec project, add emitter options under options/@azure-tools/typespec-csharp.

```diff
emit:
  - "@azure-tools/typespec-csharp"
options:
  "@azure-tools/typespec-csharp":
+    namespace: Azure.Template.MyTypeSpecProject
```

**Supported Emitter options**:
- `namespace` define the client library namespace. e.g. Azure.IoT.DeviceUpdate.
- `emitter-output-dir` define the output dire path which will store the generated code.
- `generate-protocol-methods` indicate if you want to generate **protocol method** for every operation or not. The default value is true.
- `generate-convenience-methods` indicate if you want to generate **convenience method** for every operation or not. The default value is true.
- `unreferenced-types-handling` define the strategy how to handle the unreferenced types. It can be `removeOrInternalize`, `internalize` or `keepAll`
- `model-namespace` indicate if we want to put the models in their own namespace which is a sub namespace of the client library namespace plus ".Models". if it is set `false`, the models will be put in the same namespace of the client. The default value is `true`.
- `clear-output-folder` indicate if you want to clear up the output folder.
- `package-name` define the package folder name which will be used as service directory name under `sdk/` in azure-sdk-for-net repo.
- `save-inputs` indicate if you want to keep the intermediate files for debug purpose, e.g. the model json file parsed from typespec file.

## Convenience API

By default, TypeSpec-csharp generates all protocol APIs and convenience APIs.
A few exceptions are API of JSON Merge Patch, and API of long-running operation with ambiguous response type.

You can configure whether generate convenience API or not via `convenienceAPI` decorator.

See "convenientAPI" decorator from [typespec-client-generator-core](https://github.com/Azure/typespec-azure/tree/main/packages/typespec-client-generator-core).

---
jsApi: true
title: "[I] TypeSpecLibraryDef"

---
Definition of a TypeSpec library

## Extended By

- [`TypeSpecLibrary`](Interface.TypeSpecLibrary.md)

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* \{} | - |
| `E` *extends* `Record`< `string`, `any` \> | `Record`< `string`, `never` \> |

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `readonly` `diagnostics` | [`DiagnosticMap`](Type.DiagnosticMap.md)< `T` \> | Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code. |
| `emitter`? | `object` | Emitter configuration if library is an emitter. |
| `emitter.options`? | [`JSONSchemaType`](Type.JSONSchemaType.md)< `E` \> | - |
| `linter`? | [`LinterDefinition`](Interface.LinterDefinition.md) | Configuration if library is providing linting rules/rulesets. |
| `readonly` `name` | `string` | Name of the library. Must match the package.json name. |
| `requireImports`? | *readonly* `string`[] | List of other library that should be imported when this is used as an emitter.<br />Compiler will emit an error if the libraries are not explicitly imported. |

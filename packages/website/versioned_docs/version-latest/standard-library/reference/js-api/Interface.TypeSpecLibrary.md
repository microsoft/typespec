---
jsApi: true
title: "[I] TypeSpecLibrary"

---
Definition of a TypeSpec library

## Extends

- [`TypeSpecLibraryDef`](Interface.TypeSpecLibraryDef.md)< `T`, `E` \>

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
| `emitterOptionValidator`? | [`JSONSchemaValidator`](Interface.JSONSchemaValidator.md) | JSON Schema validator for emitter options |
| `linter`? | [`LinterDefinition`](Interface.LinterDefinition.md) | Configuration if library is providing linting rules/rulesets. |
| `readonly` `name` | `string` | Name of the library. Must match the package.json name. |
| `requireImports`? | *readonly* `string`[] | List of other library that should be imported when this is used as an emitter.<br />Compiler will emit an error if the libraries are not explicitly imported. |

## Methods

### createDiagnostic

```ts
createDiagnostic<C, M>(diag): Diagnostic
```

#### Type parameters

| Parameter |
| :------ |
| `C` *extends* `string` \| `number` \| `symbol` |
| `M` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diag` | [`DiagnosticReport`](Type.DiagnosticReport.md)< `T`, `C`, `M` \> |

#### Returns

[`Diagnostic`](Interface.Diagnostic.md)

***

### createStateSymbol

```ts
createStateSymbol(name): symbol
```

Get or create a symbol with the given name unique for that library.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | Symbol name scoped with the library name. |

#### Returns

`symbol`

***

### getTracer

```ts
getTracer(program): Tracer
```

Returns a tracer scopped to the current library.
All trace area logged via this tracer will be prefixed with the library name.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Interface.Program.md) |

#### Returns

[`Tracer`](Interface.Tracer.md)

***

### reportDiagnostic

```ts
reportDiagnostic<C, M>(program, diag): void
```

#### Type parameters

| Parameter |
| :------ |
| `C` *extends* `string` \| `number` \| `symbol` |
| `M` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Interface.Program.md) |
| `diag` | [`DiagnosticReport`](Type.DiagnosticReport.md)< `T`, `C`, `M` \> |

#### Returns

`void`

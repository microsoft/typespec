---
jsApi: true
title: "[I] TypeSpecLibrary"

---
Definition of a TypeSpec library

## Extends

- [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md)<`T`, `E`\>

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` extends `object` | - |
| `E` extends `Record`<`string`, `any`\> | `Record`<`string`, `never`\> |

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `diagnostics` | [`DiagnosticMap`](../type-aliases/DiagnosticMap.md)<`T`\> | Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code. | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`diagnostics` |
| `readonly` | `emitter?` | `object` | Emitter configuration if library is an emitter. | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`emitter` |
| `readonly` | `emitter.options?` | [`JSONSchemaType`](../type-aliases/JSONSchemaType.md)<`E`\> | - | - |
| `readonly` | `emitterOptionValidator?` | [`JSONSchemaValidator`](JSONSchemaValidator.md) | JSON Schema validator for emitter options | - |
| `readonly` | `linter?` | [`LinterDefinition`](LinterDefinition.md) | Configuration if library is providing linting rules/rulesets. | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`linter` |
| `readonly` | `name` | `string` | Name of the library. Must match the package.json name. | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`name` |
| `public` | `requireImports?` | readonly `string`[] | List of other library that should be imported when this is used as an emitter.<br />Compiler will emit an error if the libraries are not explicitly imported. | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`requireImports` |

## Methods

### createDiagnostic()

```ts
createDiagnostic<C, M>(diag): Diagnostic
```

#### Type parameters

| Parameter |
| :------ |
| `C` extends `string` \| `number` \| `symbol` |
| `M` extends `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diag` | [`DiagnosticReport`](../type-aliases/DiagnosticReport.md)<`T`, `C`, `M`\> |

***

### createStateSymbol()

```ts
createStateSymbol(name): symbol
```

Get or create a symbol with the given name unique for that library.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | Symbol name scoped with the library name. |

***

### getTracer()

```ts
getTracer(program): Tracer
```

Returns a tracer scopped to the current library.
All trace area logged via this tracer will be prefixed with the library name.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Program.md) |

***

### reportDiagnostic()

```ts
reportDiagnostic<C, M>(program, diag): void
```

#### Type parameters

| Parameter |
| :------ |
| `C` extends `string` \| `number` \| `symbol` |
| `M` extends `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | [`Program`](Program.md) |
| `diag` | [`DiagnosticReport`](../type-aliases/DiagnosticReport.md)<`T`, `C`, `M`\> |

---
jsApi: true
title: "[I] TypeSpecLibrary"

---
## Extends

- [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md)<`T`, `E`, `State`\>

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends `Object` | - |
| `E` extends `Record`<`string`, `any`\> | `Record`<`string`, `never`\> |
| `State` extends `string` | `never` |

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `readonly` | `diagnostics` | [`DiagnosticMap`](../type-aliases/DiagnosticMap.md)<`T`\> | Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code. | [`TypeSpecLibraryDef.diagnostics`](TypeSpecLibraryDef.md) |
| `readonly` | `emitter?` | `Object` | Emitter configuration if library is an emitter. | [`TypeSpecLibraryDef.emitter`](TypeSpecLibraryDef.md) |
| `readonly` | `emitter.options?` | [`JSONSchemaType`](../type-aliases/JSONSchemaType.md)<`E`\> | - | - |
| `readonly` | ~~`linter?`~~ | [`LinterDefinition`](LinterDefinition.md) | Configuration if library is providing linting rules/rulesets.<br /><br />**Deprecated**<br />Use `export const $linter` instead. This will cause circular reference with linters. | [`TypeSpecLibraryDef.linter`](TypeSpecLibraryDef.md) |
| `readonly` | `name` | `string` | Library name | [`TypeSpecLibraryDef.name`](TypeSpecLibraryDef.md) |
| `readonly` | `requireImports?` | readonly `string`[] | List of other library that should be imported when this is used as an emitter.<br />Compiler will emit an error if the libraries are not explicitly imported. | [`TypeSpecLibraryDef.requireImports`](TypeSpecLibraryDef.md) |
| `readonly` | `state?` | `Record`<`State`, [`StateDef`](StateDef.md)\> | - | [`TypeSpecLibraryDef.state`](TypeSpecLibraryDef.md) |
| `public` | `stateKeys` | `Record`<`State`, `symbol`\> | - | - |

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

#### Returns

[`Diagnostic`](Diagnostic.md)

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

#### Returns

`symbol`

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

#### Returns

[`Tracer`](Tracer.md)

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

#### Returns

`void`

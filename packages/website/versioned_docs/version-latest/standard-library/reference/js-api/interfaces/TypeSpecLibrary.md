---
jsApi: true
title: "[I] TypeSpecLibrary"

---
## Extends

- [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md)<`T`, `E`, `State`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `object` | - |
| `E` *extends* `Record`<`string`, `any`\> | `Record`<`string`, `never`\> |
| `State` *extends* `string` | `never` |

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `diagnostics` | `readonly` | [`DiagnosticMap`](../type-aliases/DiagnosticMap.md)<`T`\> | Map of potential diagnostics that can be emitted in this library where the key is the diagnostic code. | - | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`diagnostics` |
| `emitter?` | `readonly` | `object` | Emitter configuration if library is an emitter. | - | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`emitter` |
| `emitter.options?` | `public` | [`JSONSchemaType`](../type-aliases/JSONSchemaType.md)<`E`\> | - | - | - |
| ~~`linter?`~~ | `readonly` | [`LinterDefinition`](LinterDefinition.md) | Configuration if library is providing linting rules/rulesets. **Deprecated** Use `export const $linter` instead. This will cause circular reference with linters. | - | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`linter` |
| `name` | `readonly` | `string` | Library name | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`name` | - |
| `requireImports?` | `readonly` | readonly `string`[] | List of other library that should be imported when this is used as an emitter. Compiler will emit an error if the libraries are not explicitly imported. | - | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`requireImports` |
| `state?` | `readonly` | `Record`<`State`, [`StateDef`](StateDef.md)\> | - | - | [`TypeSpecLibraryDef`](TypeSpecLibraryDef.md).`state` |
| `stateKeys` | `readonly` | `Record`<`State`, `symbol`\> | - | - | - |

## Methods

### createDiagnostic()

```ts
createDiagnostic<C, M>(diag): Diagnostic
```

#### Type Parameters

| Type Parameter |
| ------ |
| `C` *extends* `string` \| `number` \| `symbol` |
| `M` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
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
| ------ | ------ | ------ |
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
| ------ | ------ |
| `program` | [`Program`](Program.md) |

#### Returns

[`Tracer`](Tracer.md)

***

### reportDiagnostic()

```ts
reportDiagnostic<C, M>(program, diag): void
```

#### Type Parameters

| Type Parameter |
| ------ |
| `C` *extends* `string` \| `number` \| `symbol` |
| `M` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `program` | [`Program`](Program.md) |
| `diag` | [`DiagnosticReport`](../type-aliases/DiagnosticReport.md)<`T`, `C`, `M`\> |

#### Returns

`void`

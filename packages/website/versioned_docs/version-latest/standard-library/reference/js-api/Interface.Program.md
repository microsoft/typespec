---
jsApi: true
title: "[I] Program"

---
## Extended By

- [`ProjectedProgram`](Interface.ProjectedProgram.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `checker` | [`Checker`](Interface.Checker.md) | - |
| `compilerOptions` | [`CompilerOptions`](Interface.CompilerOptions.md) | - |
| `readonly` `diagnostics` | *readonly* [`Diagnostic`](Interface.Diagnostic.md)[] | - |
| `emitters` | `EmitterRef`[] | - |
| `host` | [`CompilerHost`](Interface.CompilerHost.md) | - |
| `jsSourceFiles` | `Map`< `string`, [`JsSourceFileNode`](Interface.JsSourceFileNode.md) \> | - |
| `literalTypes` | `Map`< `string` \| `number` \| `boolean`, [`LiteralType`](Type.LiteralType.md) \> | - |
| `mainFile`? | [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) | - |
| `readonly` `projectRoot` | `string` | Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located. |
| `sourceFiles` | `Map`< `string`, [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) \> | All source files in the program, keyed by their file path. |
| `stateMaps` | `Map`< `symbol`, `StateMap` \> | - |
| `stateSets` | `Map`< `symbol`, `StateSet` \> | - |
| `tracer` | [`Tracer`](Interface.Tracer.md) | - |

## Methods

### getGlobalNamespaceType

```ts
getGlobalNamespaceType(): Namespace
```

#### Returns

[`Namespace`](Interface.Namespace.md)

***

### getOption

```ts
getOption(key): undefined | string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`undefined` \| `string`

***

### getSourceFileLocationContext

```ts
getSourceFileLocationContext(sourceFile): LocationContext
```

Return location context of the given source file.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `sourceFile` | [`SourceFile`](Interface.SourceFile.md) |

#### Returns

[`LocationContext`](Type.LocationContext.md)

***

### hasError

```ts
hasError(): boolean
```

#### Returns

`boolean`

***

### loadTypeSpecScript

```ts
loadTypeSpecScript(typespecScript): Promise< TypeSpecScriptNode >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typespecScript` | [`SourceFile`](Interface.SourceFile.md) |

#### Returns

`Promise`< [`TypeSpecScriptNode`](Interface.TypeSpecScriptNode.md) \>

***

### onValidate

```ts
onValidate(cb, LibraryMetadata): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `cb` | (`program`) => `void` \| `Promise`< `void` \> |
| `LibraryMetadata` | [`LibraryMetadata`](Type.LibraryMetadata.md) |

#### Returns

`void`

***

### reportDiagnostic

```ts
reportDiagnostic(diagnostic): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diagnostic` | [`Diagnostic`](Interface.Diagnostic.md) |

#### Returns

`void`

***

### reportDiagnostics

```ts
reportDiagnostics(diagnostics): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diagnostics` | *readonly* [`Diagnostic`](Interface.Diagnostic.md)[] |

#### Returns

`void`

***

### reportDuplicateSymbols

```ts
reportDuplicateSymbols(symbols): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `symbols` | `undefined` \| `SymbolTable` |

#### Returns

`void`

***

### resolveTypeReference

```ts
resolveTypeReference(reference): [undefined | Type, readonly Diagnostic[]]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `reference` | `string` |

#### Returns

[`undefined` \| [`Type`](Type.Type.md), *readonly* [`Diagnostic`](Interface.Diagnostic.md)[]]

***

### stateMap

```ts
stateMap(key): Map< Type, any >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Returns

`Map`< [`Type`](Type.Type.md), `any` \>

***

### stateSet

```ts
stateSet(key): Set< Type >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Returns

`Set`< [`Type`](Type.Type.md) \>

***

### trace

```ts
trace(area, message): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `area` | `string` |
| `message` | `string` |

#### Returns

`void`

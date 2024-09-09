---
jsApi: true
title: "[I] Program"

---
## Extended by

- [`ProjectedProgram`](ProjectedProgram.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `checker` | `public` | [`Checker`](Checker.md) | - |
| `compilerOptions` | `public` | [`CompilerOptions`](CompilerOptions.md) | - |
| `diagnostics` | `readonly` | readonly [`Diagnostic`](Diagnostic.md)[] | - |
| `emitters` | `public` | `EmitterRef`[] | - |
| `host` | `public` | [`CompilerHost`](CompilerHost.md) | - |
| `jsSourceFiles` | `public` | `Map`<`string`, [`JsSourceFileNode`](JsSourceFileNode.md)\> | - |
| `literalTypes` | `public` | `Map`<`string` \| `number` \| `boolean`, [`LiteralType`](../type-aliases/LiteralType.md)\> | - |
| `mainFile?` | `public` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) | - |
| `projectRoot` | `readonly` | `string` | Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located. |
| `sourceFiles` | `public` | `Map`<`string`, [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\> | All source files in the program, keyed by their file path. |
| `stateMaps` | `public` | `Map`<`symbol`, `StateMap`\> | - |
| `stateSets` | `public` | `Map`<`symbol`, `StateSet`\> | - |
| `tracer` | `public` | [`Tracer`](Tracer.md) | - |

## Methods

### getGlobalNamespaceType()

```ts
getGlobalNamespaceType(): Namespace
```

#### Returns

[`Namespace`](Namespace.md)

***

### getOption()

```ts
getOption(key): undefined | string
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |

#### Returns

`undefined` \| `string`

***

### getSourceFileLocationContext()

```ts
getSourceFileLocationContext(sourceFile): LocationContext
```

Return location context of the given source file.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceFile` | [`SourceFile`](SourceFile.md) |

#### Returns

[`LocationContext`](../type-aliases/LocationContext.md)

***

### hasError()

```ts
hasError(): boolean
```

#### Returns

`boolean`

***

### loadTypeSpecScript()

```ts
loadTypeSpecScript(typespecScript): Promise<TypeSpecScriptNode>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `typespecScript` | [`SourceFile`](SourceFile.md) |

#### Returns

`Promise`<[`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

***

### onValidate()

```ts
onValidate(cb, LibraryMetadata): void
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `cb` | (`program`) => `void` \| `Promise`<`void`\> |
| `LibraryMetadata` | [`LibraryMetadata`](../type-aliases/LibraryMetadata.md) |

#### Returns

`void`

***

### reportDiagnostic()

```ts
reportDiagnostic(diagnostic): void
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) |

#### Returns

`void`

***

### reportDiagnostics()

```ts
reportDiagnostics(diagnostics): void
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] |

#### Returns

`void`

***

### reportDuplicateSymbols()

```ts
reportDuplicateSymbols(symbols): void
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `symbols` | `undefined` \| `SymbolTable` |

#### Returns

`void`

***

### resolveTypeReference()

```ts
resolveTypeReference(reference): [undefined | Type, readonly Diagnostic[]]
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `reference` | `string` |

#### Returns

[`undefined` \| [`Type`](../type-aliases/Type.md), readonly [`Diagnostic`](Diagnostic.md)[]]

***

### stateMap()

```ts
stateMap(key): Map<Type, any>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `symbol` |

#### Returns

`Map`<[`Type`](../type-aliases/Type.md), `any`\>

***

### stateSet()

```ts
stateSet(key): Set<Type>
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `symbol` |

#### Returns

`Set`<[`Type`](../type-aliases/Type.md)\>

***

### trace()

```ts
trace(area, message): void
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `area` | `string` |
| `message` | `string` |

#### Returns

`void`

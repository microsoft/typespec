---
jsApi: true
title: "[I] Program"

---
## Extended By

- [`ProjectedProgram`](ProjectedProgram.md)

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `public` | `checker` | [`Checker`](Checker.md) | - |
| `public` | `compilerOptions` | [`CompilerOptions`](CompilerOptions.md) | - |
| `readonly` | `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] | - |
| `public` | `emitters` | `EmitterRef`[] | - |
| `public` | `host` | [`CompilerHost`](CompilerHost.md) | - |
| `public` | `jsSourceFiles` | `Map`<`string`, [`JsSourceFileNode`](JsSourceFileNode.md)\> | - |
| `public` | `literalTypes` | `Map`<`string` \| `number` \| `boolean`, [`LiteralType`](../type-aliases/LiteralType.md)\> | - |
| `public` | `mainFile?` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) | - |
| `readonly` | `projectRoot` | `string` | Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located. |
| `public` | `sourceFiles` | `Map`<`string`, [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\> | All source files in the program, keyed by their file path. |
| `public` | `stateMaps` | `Map`<`symbol`, `StateMap`\> | - |
| `public` | `stateSets` | `Map`<`symbol`, `StateSet`\> | - |
| `public` | `tracer` | [`Tracer`](Tracer.md) | - |

## Methods

### getGlobalNamespaceType()

```ts
getGlobalNamespaceType(): Namespace
```

***

### getOption()

```ts
getOption(key): undefined | string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

***

### getSourceFileLocationContext()

```ts
getSourceFileLocationContext(sourceFile): LocationContext
```

Return location context of the given source file.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `sourceFile` | [`SourceFile`](SourceFile.md) |

***

### hasError()

```ts
hasError(): boolean
```

***

### loadTypeSpecScript()

```ts
loadTypeSpecScript(typespecScript): Promise<TypeSpecScriptNode>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typespecScript` | [`SourceFile`](SourceFile.md) |

***

### onValidate()

```ts
onValidate(cb, LibraryMetadata): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `cb` | (`program`) => `void` \| `Promise`<`void`\> |
| `LibraryMetadata` | [`LibraryMetadata`](../type-aliases/LibraryMetadata.md) |

***

### reportDiagnostic()

```ts
reportDiagnostic(diagnostic): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) |

***

### reportDiagnostics()

```ts
reportDiagnostics(diagnostics): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] |

***

### reportDuplicateSymbols()

```ts
reportDuplicateSymbols(symbols): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `symbols` | `undefined` \| `SymbolTable` |

***

### resolveTypeReference()

```ts
resolveTypeReference(reference): [undefined | Type, readonly Diagnostic[]]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `reference` | `string` |

***

### stateMap()

```ts
stateMap(key): Map<Type, any>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `symbol` |

***

### stateSet()

```ts
stateSet(key): Set<Type>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `symbol` |

***

### trace()

```ts
trace(area, message): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `area` | `string` |
| `message` | `string` |

---
jsApi: true
title: "[I] ProjectedProgram"

---
## Extends

- [`Program`](Program.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `public` | `checker` | [`Checker`](Checker.md) | - | [`Program.checker`](Program.md) |
| `public` | `compilerOptions` | [`CompilerOptions`](CompilerOptions.md) | - | [`Program.compilerOptions`](Program.md) |
| `readonly` | `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] | - | [`Program.diagnostics`](Program.md) |
| `public` | `emitters` | `EmitterRef`[] | - | [`Program.emitters`](Program.md) |
| `public` | `host` | [`CompilerHost`](CompilerHost.md) | - | [`Program.host`](Program.md) |
| `public` | `jsSourceFiles` | `Map`<`string`, [`JsSourceFileNode`](JsSourceFileNode.md)\> | - | [`Program.jsSourceFiles`](Program.md) |
| `public` | `literalTypes` | `Map`<`string` \| `number` \| `boolean`, [`LiteralType`](../type-aliases/LiteralType.md)\> | - | [`Program.literalTypes`](Program.md) |
| `public` | `mainFile?` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) | - | [`Program.mainFile`](Program.md) |
| `readonly` | `projectRoot` | `string` | Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located. | [`Program.projectRoot`](Program.md) |
| `public` | `projector` | [`Projector`](Projector.md) | - | - |
| `public` | `sourceFiles` | `Map`<`string`, [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\> | All source files in the program, keyed by their file path. | [`Program.sourceFiles`](Program.md) |
| `public` | `stateMaps` | `Map`<`symbol`, `StateMap`\> | - | [`Program.stateMaps`](Program.md) |
| `public` | `stateSets` | `Map`<`symbol`, `StateSet`\> | - | [`Program.stateSets`](Program.md) |
| `public` | `tracer` | [`Tracer`](Tracer.md) | - | [`Program.tracer`](Program.md) |

## Methods

### getGlobalNamespaceType()

```ts
getGlobalNamespaceType(): Namespace
```

#### Returns

[`Namespace`](Namespace.md)

#### Inherited from

[`Program.getGlobalNamespaceType`](Program.md#getglobalnamespacetype)

***

### getOption()

```ts
getOption(key): undefined | string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`undefined` \| `string`

#### Inherited from

[`Program.getOption`](Program.md#getoption)

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

#### Returns

[`LocationContext`](../type-aliases/LocationContext.md)

#### Inherited from

[`Program.getSourceFileLocationContext`](Program.md#getsourcefilelocationcontext)

***

### hasError()

```ts
hasError(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`Program.hasError`](Program.md#haserror)

***

### loadTypeSpecScript()

```ts
loadTypeSpecScript(typespecScript): Promise<TypeSpecScriptNode>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typespecScript` | [`SourceFile`](SourceFile.md) |

#### Returns

`Promise`<[`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

#### Inherited from

[`Program.loadTypeSpecScript`](Program.md#loadtypespecscript)

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

#### Returns

`void`

#### Inherited from

[`Program.onValidate`](Program.md#onvalidate)

***

### reportDiagnostic()

```ts
reportDiagnostic(diagnostic): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) |

#### Returns

`void`

#### Inherited from

[`Program.reportDiagnostic`](Program.md#reportdiagnostic)

***

### reportDiagnostics()

```ts
reportDiagnostics(diagnostics): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] |

#### Returns

`void`

#### Inherited from

[`Program.reportDiagnostics`](Program.md#reportdiagnostics)

***

### reportDuplicateSymbols()

```ts
reportDuplicateSymbols(symbols): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `symbols` | `undefined` \| `SymbolTable` |

#### Returns

`void`

#### Inherited from

[`Program.reportDuplicateSymbols`](Program.md#reportduplicatesymbols)

***

### resolveTypeReference()

```ts
resolveTypeReference(reference): [undefined | Type, readonly Diagnostic[]]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `reference` | `string` |

#### Returns

[`undefined` \| [`Type`](../type-aliases/Type.md), readonly [`Diagnostic`](Diagnostic.md)[]]

#### Inherited from

[`Program.resolveTypeReference`](Program.md#resolvetypereference)

***

### stateMap()

```ts
stateMap(key): Map<Type, any>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Returns

`Map`<[`Type`](../type-aliases/Type.md), `any`\>

#### Inherited from

[`Program.stateMap`](Program.md#statemap)

***

### stateSet()

```ts
stateSet(key): Set<Type>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Returns

`Set`<[`Type`](../type-aliases/Type.md)\>

#### Inherited from

[`Program.stateSet`](Program.md#stateset)

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

#### Returns

`void`

#### Inherited from

[`Program.trace`](Program.md#trace)

---
jsApi: true
title: "[I] ProjectedProgram"

---
## Extends

- [`Program`](Program.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| `checker` | `public` | [`Checker`](Checker.md) | - | [`Program`](Program.md).`checker` |
| `compilerOptions` | `public` | [`CompilerOptions`](CompilerOptions.md) | - | [`Program`](Program.md).`compilerOptions` |
| `diagnostics` | `readonly` | readonly [`Diagnostic`](Diagnostic.md)[] | - | [`Program`](Program.md).`diagnostics` |
| `emitters` | `public` | `EmitterRef`[] | - | [`Program`](Program.md).`emitters` |
| `host` | `public` | [`CompilerHost`](CompilerHost.md) | - | [`Program`](Program.md).`host` |
| `jsSourceFiles` | `public` | `Map`<`string`, [`JsSourceFileNode`](JsSourceFileNode.md)\> | - | [`Program`](Program.md).`jsSourceFiles` |
| `literalTypes` | `public` | `Map`<`string` \| `number` \| `boolean`, [`LiteralType`](../type-aliases/LiteralType.md)\> | - | [`Program`](Program.md).`literalTypes` |
| `mainFile?` | `public` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) | - | [`Program`](Program.md).`mainFile` |
| `projector` | `public` | [`Projector`](Projector.md) | - | - |
| `projectRoot` | `readonly` | `string` | Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located. | [`Program`](Program.md).`projectRoot` |
| `sourceFiles` | `public` | `Map`<`string`, [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\> | All source files in the program, keyed by their file path. | [`Program`](Program.md).`sourceFiles` |
| `stateMaps` | `public` | `Map`<`symbol`, `StateMap`\> | - | [`Program`](Program.md).`stateMaps` |
| `stateSets` | `public` | `Map`<`symbol`, `StateSet`\> | - | [`Program`](Program.md).`stateSets` |
| `tracer` | `public` | [`Tracer`](Tracer.md) | - | [`Program`](Program.md).`tracer` |

## Methods

### getGlobalNamespaceType()

```ts
getGlobalNamespaceType(): Namespace
```

#### Returns

[`Namespace`](Namespace.md)

#### Inherited from

[`Program`](Program.md).[`getGlobalNamespaceType`](Program.md#getglobalnamespacetype)

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

#### Inherited from

[`Program`](Program.md).[`getOption`](Program.md#getoption)

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

#### Inherited from

[`Program`](Program.md).[`getSourceFileLocationContext`](Program.md#getsourcefilelocationcontext)

***

### hasError()

```ts
hasError(): boolean
```

#### Returns

`boolean`

#### Inherited from

[`Program`](Program.md).[`hasError`](Program.md#haserror)

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

#### Inherited from

[`Program`](Program.md).[`loadTypeSpecScript`](Program.md#loadtypespecscript)

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

#### Inherited from

[`Program`](Program.md).[`onValidate`](Program.md#onvalidate)

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

#### Inherited from

[`Program`](Program.md).[`reportDiagnostic`](Program.md#reportdiagnostic)

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

#### Inherited from

[`Program`](Program.md).[`reportDiagnostics`](Program.md#reportdiagnostics)

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

#### Inherited from

[`Program`](Program.md).[`reportDuplicateSymbols`](Program.md#reportduplicatesymbols)

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

#### Inherited from

[`Program`](Program.md).[`resolveTypeReference`](Program.md#resolvetypereference)

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

#### Inherited from

[`Program`](Program.md).[`stateMap`](Program.md#statemap)

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

#### Inherited from

[`Program`](Program.md).[`stateSet`](Program.md#stateset)

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

#### Inherited from

[`Program`](Program.md).[`trace`](Program.md#trace)

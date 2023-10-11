---
jsApi: true
title: "[I] ProjectedProgram"

---
## Extends

- [`Program`](Program.md)

## Properties

| Modifier | Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ | :------ |
| `public` | `checker` | [`Checker`](Checker.md) | - | [`Program`](Program.md).`checker` |
| `public` | `compilerOptions` | [`CompilerOptions`](CompilerOptions.md) | - | [`Program`](Program.md).`compilerOptions` |
| `readonly` | `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] | - | [`Program`](Program.md).`diagnostics` |
| `public` | `emitters` | `EmitterRef`[] | - | [`Program`](Program.md).`emitters` |
| `public` | `host` | [`CompilerHost`](CompilerHost.md) | - | [`Program`](Program.md).`host` |
| `public` | `jsSourceFiles` | `Map`<`string`, [`JsSourceFileNode`](JsSourceFileNode.md)\> | - | [`Program`](Program.md).`jsSourceFiles` |
| `public` | `literalTypes` | `Map`<`string` \| `number` \| `boolean`, [`LiteralType`](../type-aliases/LiteralType.md)\> | - | [`Program`](Program.md).`literalTypes` |
| `public` | `mainFile?` | [`TypeSpecScriptNode`](TypeSpecScriptNode.md) | - | [`Program`](Program.md).`mainFile` |
| `readonly` | `projectRoot` | `string` | Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located. | [`Program`](Program.md).`projectRoot` |
| `public` | `projector` | [`Projector`](Projector.md) | - | - |
| `public` | `sourceFiles` | `Map`<`string`, [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\> | All source files in the program, keyed by their file path. | [`Program`](Program.md).`sourceFiles` |
| `public` | `stateMaps` | `Map`<`symbol`, `StateMap`\> | - | [`Program`](Program.md).`stateMaps` |
| `public` | `stateSets` | `Map`<`symbol`, `StateSet`\> | - | [`Program`](Program.md).`stateSets` |
| `public` | `tracer` | [`Tracer`](Tracer.md) | - | [`Program`](Program.md).`tracer` |

## Methods

### getGlobalNamespaceType()

```ts
getGlobalNamespaceType(): Namespace
```

#### Inherited from

[`Program`](Program.md).[`getGlobalNamespaceType`](Program.md#getglobalnamespacetype)

***

### getOption()

```ts
getOption(key): undefined | string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `string` |

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
| :------ | :------ |
| `sourceFile` | [`SourceFile`](SourceFile.md) |

#### Inherited from

[`Program`](Program.md).[`getSourceFileLocationContext`](Program.md#getsourcefilelocationcontext)

***

### hasError()

```ts
hasError(): boolean
```

#### Inherited from

[`Program`](Program.md).[`hasError`](Program.md#haserror)

***

### loadTypeSpecScript()

```ts
loadTypeSpecScript(typespecScript): Promise<TypeSpecScriptNode>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `typespecScript` | [`SourceFile`](SourceFile.md) |

#### Inherited from

[`Program`](Program.md).[`loadTypeSpecScript`](Program.md#loadtypespecscript)

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

#### Inherited from

[`Program`](Program.md).[`onValidate`](Program.md#onvalidate)

***

### reportDiagnostic()

```ts
reportDiagnostic(diagnostic): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) |

#### Inherited from

[`Program`](Program.md).[`reportDiagnostic`](Program.md#reportdiagnostic)

***

### reportDiagnostics()

```ts
reportDiagnostics(diagnostics): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] |

#### Inherited from

[`Program`](Program.md).[`reportDiagnostics`](Program.md#reportdiagnostics)

***

### reportDuplicateSymbols()

```ts
reportDuplicateSymbols(symbols): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `symbols` | `undefined` \| `SymbolTable` |

#### Inherited from

[`Program`](Program.md).[`reportDuplicateSymbols`](Program.md#reportduplicatesymbols)

***

### resolveTypeReference()

```ts
resolveTypeReference(reference): [undefined | Type, readonly Diagnostic[]]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `reference` | `string` |

#### Inherited from

[`Program`](Program.md).[`resolveTypeReference`](Program.md#resolvetypereference)

***

### stateMap()

```ts
stateMap(key): Map<Type, any>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Inherited from

[`Program`](Program.md).[`stateMap`](Program.md#statemap)

***

### stateSet()

```ts
stateSet(key): Set<Type>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Inherited from

[`Program`](Program.md).[`stateSet`](Program.md#stateset)

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

#### Inherited from

[`Program`](Program.md).[`trace`](Program.md#trace)

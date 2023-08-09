[JS Api](../index.md) / Program

# Interface: Program

## Hierarchy

- **`Program`**

  ↳ [`ProjectedProgram`](ProjectedProgram.md)

## Table of contents

### Properties

- [checker](Program.md#checker)
- [compilerOptions](Program.md#compileroptions)
- [diagnostics](Program.md#diagnostics)
- [emitters](Program.md#emitters)
- [host](Program.md#host)
- [jsSourceFiles](Program.md#jssourcefiles)
- [literalTypes](Program.md#literaltypes)
- [mainFile](Program.md#mainfile)
- [projectRoot](Program.md#projectroot)
- [sourceFiles](Program.md#sourcefiles)
- [stateMaps](Program.md#statemaps)
- [stateSets](Program.md#statesets)
- [tracer](Program.md#tracer)

### Methods

- [getGlobalNamespaceType](Program.md#getglobalnamespacetype)
- [getOption](Program.md#getoption)
- [getSourceFileLocationContext](Program.md#getsourcefilelocationcontext)
- [hasError](Program.md#haserror)
- [loadTypeSpecScript](Program.md#loadtypespecscript)
- [onValidate](Program.md#onvalidate)
- [reportDiagnostic](Program.md#reportdiagnostic)
- [reportDiagnostics](Program.md#reportdiagnostics)
- [reportDuplicateSymbols](Program.md#reportduplicatesymbols)
- [resolveTypeReference](Program.md#resolvetypereference)
- [stateMap](Program.md#statemap)
- [stateSet](Program.md#stateset)
- [trace](Program.md#trace)

## Properties

### checker

• **checker**: [`Checker`](Checker.md)

___

### compilerOptions

• **compilerOptions**: `CompilerOptions`

___

### diagnostics

• `Readonly` **diagnostics**: readonly [`Diagnostic`](Diagnostic.md)[]

___

### emitters

• **emitters**: `EmitterRef`[]

___

### host

• **host**: [`CompilerHost`](CompilerHost.md)

___

### jsSourceFiles

• **jsSourceFiles**: `Map`<`string`, [`JsSourceFileNode`](JsSourceFileNode.md)\>

___

### literalTypes

• **literalTypes**: `Map`<`string` \| `number` \| `boolean`, [`LiteralType`](../index.md#literaltype)\>

___

### mainFile

• `Optional` **mainFile**: [`TypeSpecScriptNode`](TypeSpecScriptNode.md)

___

### projectRoot

• `Readonly` **projectRoot**: `string`

Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located.

___

### sourceFiles

• **sourceFiles**: `Map`<`string`, [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

All source files in the program, keyed by their file path.

___

### stateMaps

• **stateMaps**: `Map`<`symbol`, `StateMap`\>

___

### stateSets

• **stateSets**: `Map`<`symbol`, `StateSet`\>

___

### tracer

• **tracer**: [`Tracer`](Tracer.md)

## Methods

### getGlobalNamespaceType

▸ **getGlobalNamespaceType**(): [`Namespace`](Namespace.md)

#### Returns

[`Namespace`](Namespace.md)

___

### getOption

▸ **getOption**(`key`): `undefined` \| `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`undefined` \| `string`

___

### getSourceFileLocationContext

▸ **getSourceFileLocationContext**(`sourceFile`): [`LocationContext`](../index.md#locationcontext)

Return location context of the given source file.

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceFile` | [`SourceFile`](SourceFile.md) |

#### Returns

[`LocationContext`](../index.md#locationcontext)

___

### hasError

▸ **hasError**(): `boolean`

#### Returns

`boolean`

___

### loadTypeSpecScript

▸ **loadTypeSpecScript**(`typespecScript`): `Promise`<[`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `typespecScript` | [`SourceFile`](SourceFile.md) |

#### Returns

`Promise`<[`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

___

### onValidate

▸ **onValidate**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | (`program`: [`Program`](Program.md)) => `void` \| `Promise`<`void`\> |

#### Returns

`void`

___

### reportDiagnostic

▸ **reportDiagnostic**(`diagnostic`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) |

#### Returns

`void`

___

### reportDiagnostics

▸ **reportDiagnostics**(`diagnostics`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] |

#### Returns

`void`

___

### reportDuplicateSymbols

▸ **reportDuplicateSymbols**(`symbols`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbols` | `undefined` \| [`SymbolTable`](SymbolTable.md) |

#### Returns

`void`

___

### resolveTypeReference

▸ **resolveTypeReference**(`reference`): [`undefined` \| [`Type`](../index.md#type), readonly [`Diagnostic`](Diagnostic.md)[]]

#### Parameters

| Name | Type |
| :------ | :------ |
| `reference` | `string` |

#### Returns

[`undefined` \| [`Type`](../index.md#type), readonly [`Diagnostic`](Diagnostic.md)[]]

___

### stateMap

▸ **stateMap**(`key`): `Map`<[`Type`](../index.md#type), `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Returns

`Map`<[`Type`](../index.md#type), `any`\>

___

### stateSet

▸ **stateSet**(`key`): `Set`<[`Type`](../index.md#type)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Returns

`Set`<[`Type`](../index.md#type)\>

___

### trace

▸ **trace**(`area`, `message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `area` | `string` |
| `message` | `string` |

#### Returns

`void`

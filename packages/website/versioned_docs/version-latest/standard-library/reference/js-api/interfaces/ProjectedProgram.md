[JS Api](../index.md) / ProjectedProgram

# Interface: ProjectedProgram

## Hierarchy

- [`Program`](Program.md)

  ↳ **`ProjectedProgram`**

## Table of contents

### Properties

- [checker](ProjectedProgram.md#checker)
- [compilerOptions](ProjectedProgram.md#compileroptions)
- [diagnostics](ProjectedProgram.md#diagnostics)
- [emitters](ProjectedProgram.md#emitters)
- [host](ProjectedProgram.md#host)
- [jsSourceFiles](ProjectedProgram.md#jssourcefiles)
- [literalTypes](ProjectedProgram.md#literaltypes)
- [mainFile](ProjectedProgram.md#mainfile)
- [projectRoot](ProjectedProgram.md#projectroot)
- [projector](ProjectedProgram.md#projector)
- [sourceFiles](ProjectedProgram.md#sourcefiles)
- [stateMaps](ProjectedProgram.md#statemaps)
- [stateSets](ProjectedProgram.md#statesets)
- [tracer](ProjectedProgram.md#tracer)

### Methods

- [getGlobalNamespaceType](ProjectedProgram.md#getglobalnamespacetype)
- [getOption](ProjectedProgram.md#getoption)
- [getSourceFileLocationContext](ProjectedProgram.md#getsourcefilelocationcontext)
- [hasError](ProjectedProgram.md#haserror)
- [loadTypeSpecScript](ProjectedProgram.md#loadtypespecscript)
- [onValidate](ProjectedProgram.md#onvalidate)
- [reportDiagnostic](ProjectedProgram.md#reportdiagnostic)
- [reportDiagnostics](ProjectedProgram.md#reportdiagnostics)
- [reportDuplicateSymbols](ProjectedProgram.md#reportduplicatesymbols)
- [resolveTypeReference](ProjectedProgram.md#resolvetypereference)
- [stateMap](ProjectedProgram.md#statemap)
- [stateSet](ProjectedProgram.md#stateset)
- [trace](ProjectedProgram.md#trace)

## Properties

### checker

• **checker**: [`Checker`](Checker.md)

#### Inherited from

[Program](Program.md).[checker](Program.md#checker)

___

### compilerOptions

• **compilerOptions**: `CompilerOptions`

#### Inherited from

[Program](Program.md).[compilerOptions](Program.md#compileroptions)

___

### diagnostics

• `Readonly` **diagnostics**: readonly [`Diagnostic`](Diagnostic.md)[]

#### Inherited from

[Program](Program.md).[diagnostics](Program.md#diagnostics)

___

### emitters

• **emitters**: `EmitterRef`[]

#### Inherited from

[Program](Program.md).[emitters](Program.md#emitters)

___

### host

• **host**: [`CompilerHost`](CompilerHost.md)

#### Inherited from

[Program](Program.md).[host](Program.md#host)

___

### jsSourceFiles

• **jsSourceFiles**: `Map`<`string`, [`JsSourceFileNode`](JsSourceFileNode.md)\>

#### Inherited from

[Program](Program.md).[jsSourceFiles](Program.md#jssourcefiles)

___

### literalTypes

• **literalTypes**: `Map`<`string` \| `number` \| `boolean`, [`LiteralType`](../index.md#literaltype)\>

#### Inherited from

[Program](Program.md).[literalTypes](Program.md#literaltypes)

___

### mainFile

• `Optional` **mainFile**: [`TypeSpecScriptNode`](TypeSpecScriptNode.md)

#### Inherited from

[Program](Program.md).[mainFile](Program.md#mainfile)

___

### projectRoot

• `Readonly` **projectRoot**: `string`

Project root. If a tsconfig was found/specified this is the directory for the tsconfig.json. Otherwise directory where the entrypoint is located.

#### Inherited from

[Program](Program.md).[projectRoot](Program.md#projectroot)

___

### projector

• **projector**: [`Projector`](Projector.md)

___

### sourceFiles

• **sourceFiles**: `Map`<`string`, [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

All source files in the program, keyed by their file path.

#### Inherited from

[Program](Program.md).[sourceFiles](Program.md#sourcefiles)

___

### stateMaps

• **stateMaps**: `Map`<`symbol`, `StateMap`\>

#### Inherited from

[Program](Program.md).[stateMaps](Program.md#statemaps)

___

### stateSets

• **stateSets**: `Map`<`symbol`, `StateSet`\>

#### Inherited from

[Program](Program.md).[stateSets](Program.md#statesets)

___

### tracer

• **tracer**: [`Tracer`](Tracer.md)

#### Inherited from

[Program](Program.md).[tracer](Program.md#tracer)

## Methods

### getGlobalNamespaceType

▸ **getGlobalNamespaceType**(): [`Namespace`](Namespace.md)

#### Returns

[`Namespace`](Namespace.md)

#### Inherited from

[Program](Program.md).[getGlobalNamespaceType](Program.md#getglobalnamespacetype)

___

### getOption

▸ **getOption**(`key`): `undefined` \| `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `string` |

#### Returns

`undefined` \| `string`

#### Inherited from

[Program](Program.md).[getOption](Program.md#getoption)

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

#### Inherited from

[Program](Program.md).[getSourceFileLocationContext](Program.md#getsourcefilelocationcontext)

___

### hasError

▸ **hasError**(): `boolean`

#### Returns

`boolean`

#### Inherited from

[Program](Program.md).[hasError](Program.md#haserror)

___

### loadTypeSpecScript

▸ **loadTypeSpecScript**(`typespecScript`): `Promise`<[`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `typespecScript` | [`SourceFile`](SourceFile.md) |

#### Returns

`Promise`<[`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

#### Inherited from

[Program](Program.md).[loadTypeSpecScript](Program.md#loadtypespecscript)

___

### onValidate

▸ **onValidate**(`cb`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `cb` | (`program`: [`Program`](Program.md)) => `void` \| `Promise`<`void`\> |

#### Returns

`void`

#### Inherited from

[Program](Program.md).[onValidate](Program.md#onvalidate)

___

### reportDiagnostic

▸ **reportDiagnostic**(`diagnostic`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `diagnostic` | [`Diagnostic`](Diagnostic.md) |

#### Returns

`void`

#### Inherited from

[Program](Program.md).[reportDiagnostic](Program.md#reportdiagnostic)

___

### reportDiagnostics

▸ **reportDiagnostics**(`diagnostics`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `diagnostics` | readonly [`Diagnostic`](Diagnostic.md)[] |

#### Returns

`void`

#### Inherited from

[Program](Program.md).[reportDiagnostics](Program.md#reportdiagnostics)

___

### reportDuplicateSymbols

▸ **reportDuplicateSymbols**(`symbols`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbols` | `undefined` \| [`SymbolTable`](SymbolTable.md) |

#### Returns

`void`

#### Inherited from

[Program](Program.md).[reportDuplicateSymbols](Program.md#reportduplicatesymbols)

___

### resolveTypeReference

▸ **resolveTypeReference**(`reference`): [`undefined` \| [`Type`](../index.md#type), readonly [`Diagnostic`](Diagnostic.md)[]]

#### Parameters

| Name | Type |
| :------ | :------ |
| `reference` | `string` |

#### Returns

[`undefined` \| [`Type`](../index.md#type), readonly [`Diagnostic`](Diagnostic.md)[]]

#### Inherited from

[Program](Program.md).[resolveTypeReference](Program.md#resolvetypereference)

___

### stateMap

▸ **stateMap**(`key`): `Map`<[`Type`](../index.md#type), `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Returns

`Map`<[`Type`](../index.md#type), `any`\>

#### Inherited from

[Program](Program.md).[stateMap](Program.md#statemap)

___

### stateSet

▸ **stateSet**(`key`): `Set`<[`Type`](../index.md#type)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `symbol` |

#### Returns

`Set`<[`Type`](../index.md#type)\>

#### Inherited from

[Program](Program.md).[stateSet](Program.md#stateset)

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

#### Inherited from

[Program](Program.md).[trace](Program.md#trace)

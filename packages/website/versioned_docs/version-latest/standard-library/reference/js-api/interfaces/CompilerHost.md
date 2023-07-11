[JS Api](../index.md) / CompilerHost

# Interface: CompilerHost

## Table of contents

### Properties

- [logSink](CompilerHost.md#logsink)
- [parseCache](CompilerHost.md#parsecache)

### Methods

- [fileURLToPath](CompilerHost.md#fileurltopath)
- [getExecutionRoot](CompilerHost.md#getexecutionroot)
- [getJsImport](CompilerHost.md#getjsimport)
- [getLibDirs](CompilerHost.md#getlibdirs)
- [getSourceFileKind](CompilerHost.md#getsourcefilekind)
- [mkdirp](CompilerHost.md#mkdirp)
- [pathToFileURL](CompilerHost.md#pathtofileurl)
- [readDir](CompilerHost.md#readdir)
- [readFile](CompilerHost.md#readfile)
- [readUrl](CompilerHost.md#readurl)
- [realpath](CompilerHost.md#realpath)
- [rm](CompilerHost.md#rm)
- [stat](CompilerHost.md#stat)
- [writeFile](CompilerHost.md#writefile)

## Properties

### logSink

• **logSink**: [`LogSink`](LogSink.md)

___

### parseCache

• `Optional` **parseCache**: `WeakMap`<[`SourceFile`](SourceFile.md), [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\>

Optional cache to reuse the results of parsing and binding across programs.

## Methods

### fileURLToPath

▸ **fileURLToPath**(`url`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |

#### Returns

`string`

___

### getExecutionRoot

▸ **getExecutionRoot**(): `string`

#### Returns

`string`

___

### getJsImport

▸ **getJsImport**(`path`): `Promise`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<`Record`<`string`, `any`\>\>

___

### getLibDirs

▸ **getLibDirs**(): `string`[]

#### Returns

`string`[]

___

### getSourceFileKind

▸ **getSourceFileKind**(`path`): `undefined` \| [`SourceFileKind`](../index.md#sourcefilekind)

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`undefined` \| [`SourceFileKind`](../index.md#sourcefilekind)

___

### mkdirp

▸ **mkdirp**(`path`): `Promise`<`undefined` \| `string`\>

create directory recursively.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | Path to the directory. |

#### Returns

`Promise`<`undefined` \| `string`\>

___

### pathToFileURL

▸ **pathToFileURL**(`path`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`string`

___

### readDir

▸ **readDir**(`dir`): `Promise`<`string`[]\>

Read directory.

#### Parameters

| Name | Type |
| :------ | :------ |
| `dir` | `string` |

#### Returns

`Promise`<`string`[]\>

list of file/directory in the given directory. Returns the name not the full path.

___

### readFile

▸ **readFile**(`path`): `Promise`<[`SourceFile`](SourceFile.md)\>

read a utf-8 or utf-8 with bom encoded file

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<[`SourceFile`](SourceFile.md)\>

___

### readUrl

▸ **readUrl**(`url`): `Promise`<[`SourceFile`](SourceFile.md)\>

read a file at the given url.

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |

#### Returns

`Promise`<[`SourceFile`](SourceFile.md)\>

___

### realpath

▸ **realpath**(`path`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<`string`\>

___

### rm

▸ **rm**(`path`, `options?`): `Promise`<`void`\>

Deletes a directory or file.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | Path to the directory or file. |
| `options?` | [`RmOptions`](RmOptions.md) | - |

#### Returns

`Promise`<`void`\>

___

### stat

▸ **stat**(`path`): `Promise`<{ `isDirectory`: () => `boolean` ; `isFile`: () => `boolean`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<{ `isDirectory`: () => `boolean` ; `isFile`: () => `boolean`  }\>

___

### writeFile

▸ **writeFile**(`path`, `content`): `Promise`<`void`\>

Write the file.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | Path to the file. |
| `content` | `string` | Content of the file. |

#### Returns

`Promise`<`void`\>

[JS Api](../index.md) / ResolveModuleHost

# Interface: ResolveModuleHost

## Table of contents

### Methods

- [readFile](ResolveModuleHost.md#readfile)
- [realpath](ResolveModuleHost.md#realpath)
- [stat](ResolveModuleHost.md#stat)

## Methods

### readFile

▸ **readFile**(`path`): `Promise`<`string`\>

Read a utf-8 encoded file.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<`string`\>

___

### realpath

▸ **realpath**(`path`): `Promise`<`string`\>

Resolve the real path for the current host.

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<`string`\>

___

### stat

▸ **stat**(`path`): `Promise`<{ `isDirectory`: () => `boolean` ; `isFile`: () => `boolean`  }\>

Get information about the given path

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<{ `isDirectory`: () => `boolean` ; `isFile`: () => `boolean`  }\>

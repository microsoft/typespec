[JS Api](../index.md) / ServerHost

# Interface: ServerHost

## Table of contents

### Properties

- [compilerHost](ServerHost.md#compilerhost)
- [throwInternalErrors](ServerHost.md#throwinternalerrors)

### Methods

- [getOpenDocumentByURL](ServerHost.md#getopendocumentbyurl)
- [log](ServerHost.md#log)
- [sendDiagnostics](ServerHost.md#senddiagnostics)

## Properties

### compilerHost

• **compilerHost**: [`CompilerHost`](CompilerHost.md)

___

### throwInternalErrors

• `Optional` **throwInternalErrors**: `boolean`

## Methods

### getOpenDocumentByURL

▸ **getOpenDocumentByURL**(`url`): `undefined` \| `TextDocument`

#### Parameters

| Name | Type |
| :------ | :------ |
| `url` | `string` |

#### Returns

`undefined` \| `TextDocument`

___

### log

▸ **log**(`message`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |

#### Returns

`void`

___

### sendDiagnostics

▸ **sendDiagnostics**(`params`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `PublishDiagnosticsParams` |

#### Returns

`void`

[JS Api](../index.md) / Server

# Interface: Server

## Table of contents

### Properties

- [pendingMessages](Server.md#pendingmessages)
- [workspaceFolders](Server.md#workspacefolders)

### Methods

- [buildSemanticTokens](Server.md#buildsemantictokens)
- [checkChange](Server.md#checkchange)
- [compile](Server.md#compile)
- [complete](Server.md#complete)
- [documentClosed](Server.md#documentclosed)
- [findDocumentHighlight](Server.md#finddocumenthighlight)
- [findReferences](Server.md#findreferences)
- [formatDocument](Server.md#formatdocument)
- [getDocumentSymbols](Server.md#getdocumentsymbols)
- [getFoldingRanges](Server.md#getfoldingranges)
- [getHover](Server.md#gethover)
- [getSemanticTokens](Server.md#getsemantictokens)
- [getSignatureHelp](Server.md#getsignaturehelp)
- [gotoDefinition](Server.md#gotodefinition)
- [initialize](Server.md#initialize)
- [initialized](Server.md#initialized)
- [log](Server.md#log)
- [prepareRename](Server.md#preparerename)
- [rename](Server.md#rename)
- [watchedFilesChanged](Server.md#watchedfileschanged)
- [workspaceFoldersChanged](Server.md#workspacefolderschanged)

## Properties

### pendingMessages

• `Readonly` **pendingMessages**: readonly `string`[]

___

### workspaceFolders

• `Readonly` **workspaceFolders**: readonly [`ServerWorkspaceFolder`](ServerWorkspaceFolder.md)[]

## Methods

### buildSemanticTokens

▸ **buildSemanticTokens**(`params`): `Promise`<`SemanticTokens`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `SemanticTokensParams` |

#### Returns

`Promise`<`SemanticTokens`\>

___

### checkChange

▸ **checkChange**(`change`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `change` | `TextDocumentChangeEvent`<`TextDocument`\> |

#### Returns

`Promise`<`void`\>

___

### compile

▸ **compile**(`document`): `Promise`<`undefined` \| [`Program`](Program.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `document` | `TextDocument` \| `TextDocumentIdentifier` |

#### Returns

`Promise`<`undefined` \| [`Program`](Program.md)\>

___

### complete

▸ **complete**(`params`): `Promise`<`CompletionList`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `CompletionParams` |

#### Returns

`Promise`<`CompletionList`\>

___

### documentClosed

▸ **documentClosed**(`change`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `change` | `TextDocumentChangeEvent`<`TextDocument`\> |

#### Returns

`void`

___

### findDocumentHighlight

▸ **findDocumentHighlight**(`params`): `Promise`<`DocumentHighlight`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `DocumentHighlightParams` |

#### Returns

`Promise`<`DocumentHighlight`[]\>

___

### findReferences

▸ **findReferences**(`params`): `Promise`<`Location`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `ReferenceParams` |

#### Returns

`Promise`<`Location`[]\>

___

### formatDocument

▸ **formatDocument**(`params`): `Promise`<`TextEdit`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `DocumentFormattingParams` |

#### Returns

`Promise`<`TextEdit`[]\>

___

### getDocumentSymbols

▸ **getDocumentSymbols**(`params`): `Promise`<`DocumentSymbol`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `DocumentSymbolParams` |

#### Returns

`Promise`<`DocumentSymbol`[]\>

___

### getFoldingRanges

▸ **getFoldingRanges**(`getFoldingRanges`): `Promise`<`FoldingRange`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `getFoldingRanges` | `FoldingRangeParams` |

#### Returns

`Promise`<`FoldingRange`[]\>

___

### getHover

▸ **getHover**(`params`): `Promise`<`Hover`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `HoverParams` |

#### Returns

`Promise`<`Hover`\>

___

### getSemanticTokens

▸ **getSemanticTokens**(`params`): `Promise`<[`SemanticToken`](SemanticToken.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `SemanticTokensParams` |

#### Returns

`Promise`<[`SemanticToken`](SemanticToken.md)[]\>

___

### getSignatureHelp

▸ **getSignatureHelp**(`params`): `Promise`<`undefined` \| `SignatureHelp`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `SignatureHelpParams` |

#### Returns

`Promise`<`undefined` \| `SignatureHelp`\>

___

### gotoDefinition

▸ **gotoDefinition**(`params`): `Promise`<`Location`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `DefinitionParams` |

#### Returns

`Promise`<`Location`[]\>

___

### initialize

▸ **initialize**(`params`): `Promise`<`InitializeResult`<`any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `InitializeParams` |

#### Returns

`Promise`<`InitializeResult`<`any`\>\>

___

### initialized

▸ **initialized**(`params`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `InitializedParams` |

#### Returns

`void`

___

### log

▸ **log**(`message`, `details?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |
| `details?` | `any` |

#### Returns

`void`

___

### prepareRename

▸ **prepareRename**(`params`): `Promise`<`undefined` \| `Range`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `PrepareRenameParams` |

#### Returns

`Promise`<`undefined` \| `Range`\>

___

### rename

▸ **rename**(`params`): `Promise`<`WorkspaceEdit`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `RenameParams` |

#### Returns

`Promise`<`WorkspaceEdit`\>

___

### watchedFilesChanged

▸ **watchedFilesChanged**(`params`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | `DidChangeWatchedFilesParams` |

#### Returns

`void`

___

### workspaceFoldersChanged

▸ **workspaceFoldersChanged**(`e`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `WorkspaceFoldersChangeEvent` |

#### Returns

`Promise`<`void`\>

---
jsApi: true
title: "[I] Server"

---
## Properties

| Property | Type |
| :------ | :------ |
| `readonly` `pendingMessages` | *readonly* `string`[] |
| `readonly` `workspaceFolders` | *readonly* [`ServerWorkspaceFolder`](Interface.ServerWorkspaceFolder.md)[] |

## Methods

### buildSemanticTokens

```ts
buildSemanticTokens(params): Promise< SemanticTokens >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `SemanticTokensParams` |

#### Returns

`Promise`< `SemanticTokens` \>

***

### checkChange

```ts
checkChange(change): Promise< void >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `change` | `TextDocumentChangeEvent`< `TextDocument` \> |

#### Returns

`Promise`< `void` \>

***

### compile

```ts
compile(document): Promise< undefined | Program >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `document` | `TextDocument` \| `TextDocumentIdentifier` |

#### Returns

`Promise`< `undefined` \| [`Program`](Interface.Program.md) \>

***

### complete

```ts
complete(params): Promise< CompletionList >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `CompletionParams` |

#### Returns

`Promise`< `CompletionList` \>

***

### documentClosed

```ts
documentClosed(change): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `change` | `TextDocumentChangeEvent`< `TextDocument` \> |

#### Returns

`void`

***

### findDocumentHighlight

```ts
findDocumentHighlight(params): Promise< DocumentHighlight[] >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DocumentHighlightParams` |

#### Returns

`Promise`< `DocumentHighlight`[] \>

***

### findReferences

```ts
findReferences(params): Promise< Location[] >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `ReferenceParams` |

#### Returns

`Promise`< `Location`[] \>

***

### formatDocument

```ts
formatDocument(params): Promise< TextEdit[] >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DocumentFormattingParams` |

#### Returns

`Promise`< `TextEdit`[] \>

***

### getDocumentSymbols

```ts
getDocumentSymbols(params): Promise< DocumentSymbol[] >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DocumentSymbolParams` |

#### Returns

`Promise`< `DocumentSymbol`[] \>

***

### getFoldingRanges

```ts
getFoldingRanges(getFoldingRanges): Promise< FoldingRange[] >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `getFoldingRanges` | `FoldingRangeParams` |

#### Returns

`Promise`< `FoldingRange`[] \>

***

### getHover

```ts
getHover(params): Promise< Hover >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `HoverParams` |

#### Returns

`Promise`< `Hover` \>

***

### getSemanticTokens

```ts
getSemanticTokens(params): Promise< SemanticToken[] >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `SemanticTokensParams` |

#### Returns

`Promise`< [`SemanticToken`](Interface.SemanticToken.md)[] \>

***

### getSignatureHelp

```ts
getSignatureHelp(params): Promise< undefined | SignatureHelp >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `SignatureHelpParams` |

#### Returns

`Promise`< `undefined` \| `SignatureHelp` \>

***

### gotoDefinition

```ts
gotoDefinition(params): Promise< Location[] >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DefinitionParams` |

#### Returns

`Promise`< `Location`[] \>

***

### initialize

```ts
initialize(params): Promise< InitializeResult< any > >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `InitializeParams` |

#### Returns

`Promise`< `InitializeResult`< `any` \> \>

***

### initialized

```ts
initialized(params): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `InitializedParams` |

#### Returns

`void`

***

### log

```ts
log(message, details?): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `message` | `string` |
| `details`? | `any` |

#### Returns

`void`

***

### prepareRename

```ts
prepareRename(params): Promise< undefined | Range >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `PrepareRenameParams` |

#### Returns

`Promise`< `undefined` \| `Range` \>

***

### rename

```ts
rename(params): Promise< WorkspaceEdit >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `RenameParams` |

#### Returns

`Promise`< `WorkspaceEdit` \>

***

### watchedFilesChanged

```ts
watchedFilesChanged(params): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DidChangeWatchedFilesParams` |

#### Returns

`void`

***

### workspaceFoldersChanged

```ts
workspaceFoldersChanged(e): Promise< void >
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `e` | `WorkspaceFoldersChangeEvent` |

#### Returns

`Promise`< `void` \>

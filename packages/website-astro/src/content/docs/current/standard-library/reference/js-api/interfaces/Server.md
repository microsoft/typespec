---
jsApi: true
title: "[I] Server"

---
## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `pendingMessages` | readonly `string`[] | - |
| `readonly` | `workspaceFolders` | readonly [`ServerWorkspaceFolder`](ServerWorkspaceFolder.md)[] | - |

## Methods

### buildSemanticTokens()

```ts
buildSemanticTokens(params): Promise<SemanticTokens>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `SemanticTokensParams` |

***

### checkChange()

```ts
checkChange(change): Promise<void>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `change` | `TextDocumentChangeEvent`<`TextDocument`\> |

***

### compile()

```ts
compile(document): Promise<undefined | Program>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `document` | `TextDocument` \| `TextDocumentIdentifier` |

***

### complete()

```ts
complete(params): Promise<CompletionList>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `CompletionParams` |

***

### documentClosed()

```ts
documentClosed(change): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `change` | `TextDocumentChangeEvent`<`TextDocument`\> |

***

### findDocumentHighlight()

```ts
findDocumentHighlight(params): Promise<DocumentHighlight[]>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DocumentHighlightParams` |

***

### findReferences()

```ts
findReferences(params): Promise<Location[]>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `ReferenceParams` |

***

### formatDocument()

```ts
formatDocument(params): Promise<TextEdit[]>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DocumentFormattingParams` |

***

### getDocumentSymbols()

```ts
getDocumentSymbols(params): Promise<DocumentSymbol[]>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DocumentSymbolParams` |

***

### getFoldingRanges()

```ts
getFoldingRanges(getFoldingRanges): Promise<FoldingRange[]>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `getFoldingRanges` | `FoldingRangeParams` |

***

### getHover()

```ts
getHover(params): Promise<Hover>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `HoverParams` |

***

### getSemanticTokens()

```ts
getSemanticTokens(params): Promise<SemanticToken[]>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `SemanticTokensParams` |

***

### getSignatureHelp()

```ts
getSignatureHelp(params): Promise<undefined | SignatureHelp>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `SignatureHelpParams` |

***

### gotoDefinition()

```ts
gotoDefinition(params): Promise<Location[]>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DefinitionParams` |

***

### initialize()

```ts
initialize(params): Promise<InitializeResult<any>>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `InitializeParams` |

***

### initialized()

```ts
initialized(params): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `InitializedParams` |

***

### log()

```ts
log(message, details?): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `message` | `string` |
| `details`? | `any` |

***

### prepareRename()

```ts
prepareRename(params): Promise<undefined | Range>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `PrepareRenameParams` |

***

### rename()

```ts
rename(params): Promise<WorkspaceEdit>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `RenameParams` |

***

### watchedFilesChanged()

```ts
watchedFilesChanged(params): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `DidChangeWatchedFilesParams` |

***

### workspaceFoldersChanged()

```ts
workspaceFoldersChanged(e): Promise<void>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `e` | `WorkspaceFoldersChangeEvent` |

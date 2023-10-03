---
jsApi: true
title: "[I] ServerHost"

---
## Properties

| Property | Type |
| :------ | :------ |
| `compilerHost` | [`CompilerHost`](Interface.CompilerHost.md) |
| `throwInternalErrors`? | `boolean` |

## Methods

### getOpenDocumentByURL

```ts
getOpenDocumentByURL(url): undefined | TextDocument
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `url` | `string` |

#### Returns

`undefined` \| `TextDocument`

***

### log

```ts
log(message): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `message` | `string` |

#### Returns

`void`

***

### sendDiagnostics

```ts
sendDiagnostics(params): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `PublishDiagnosticsParams` |

#### Returns

`void`

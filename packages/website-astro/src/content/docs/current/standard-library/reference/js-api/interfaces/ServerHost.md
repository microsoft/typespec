---
jsApi: true
title: "[I] ServerHost"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `compilerHost` | [`CompilerHost`](CompilerHost.md) | - |
| `throwInternalErrors?` | `boolean` | - |

## Methods

### getOpenDocumentByURL()

```ts
getOpenDocumentByURL(url): undefined | TextDocument
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `url` | `string` |

***

### log()

```ts
log(message): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `message` | `string` |

***

### sendDiagnostics()

```ts
sendDiagnostics(params): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `params` | `PublishDiagnosticsParams` |

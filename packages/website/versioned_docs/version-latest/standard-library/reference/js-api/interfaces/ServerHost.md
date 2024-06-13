---
jsApi: true
title: "[I] ServerHost"

---
## Properties

| Property | Modifier | Type |
| :------ | :------ | :------ |
| `applyEdit` | `readonly` | (`paramOrEdit`: `WorkspaceEdit` \| `ApplyWorkspaceEditParams`) => `Promise`<`ApplyWorkspaceEditResult`\> |
| `compilerHost` | `readonly` | [`CompilerHost`](CompilerHost.md) |
| `getOpenDocumentByURL` | `readonly` | (`url`: `string`) => `undefined` \| `TextDocument` |
| `log` | `readonly` | (`log`: [`ServerLog`](ServerLog.md)) => `void` |
| `sendDiagnostics` | `readonly` | (`params`: `PublishDiagnosticsParams`) => `void` |
| `throwInternalErrors?` | `readonly` | `boolean` |

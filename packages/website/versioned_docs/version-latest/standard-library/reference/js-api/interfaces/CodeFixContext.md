---
jsApi: true
title: "[I] CodeFixContext"

---
## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `appendText` | `readonly` | (`location`: [`SourceLocation`](SourceLocation.md) \| [`FilePos`](FilePos.md), `text`: `string`) => [`InsertTextCodeFixEdit`](InsertTextCodeFixEdit.md) | Add the given text after the range or pos given. |
| `prependText` | `readonly` | (`location`: [`SourceLocation`](SourceLocation.md) \| [`FilePos`](FilePos.md), `text`: `string`) => [`InsertTextCodeFixEdit`](InsertTextCodeFixEdit.md) | Add the given text before the range or pos given. |
| `replaceText` | `readonly` | (`location`: [`SourceLocation`](SourceLocation.md), `newText`: `string`) => [`ReplaceTextCodeFixEdit`](ReplaceTextCodeFixEdit.md) | Replace the text at the given range. |

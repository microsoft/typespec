---
jsApi: true
title: "[I] SourceModel"

---
## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `model` | `readonly` | [`Model`](Model.md) | Source model |
| `usage` | `readonly` | `"is"` \| `"spread"` \| `"intersection"` | How was this model used. - is: `model A is B` - spread: `model A {...B}` - intersection: `alias A = B & C` |

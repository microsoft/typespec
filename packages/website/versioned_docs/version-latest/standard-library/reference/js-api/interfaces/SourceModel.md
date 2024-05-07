---
jsApi: true
title: "[I] SourceModel"

---
## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `model` | `readonly` | [`Model`](Model.md) | Source model |
| `usage` | `readonly` | `"is"` \| `"spread"` \| `"intersection"` | How was this model used.<br />- is: `model A is B`<br />- spread: `model A {...B}`<br />- intersection: `alias A = B & C` |

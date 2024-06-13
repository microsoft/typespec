---
jsApi: true
title: "[I] SourceModel"

---
## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `model` | `readonly` | [`Model`](Model.md) | Source model |
| `usage` | `readonly` | `"is"` \| `"spread"` \| `"intersection"` | <p>How was this model used.</p><ul><li>is: `model A is B`</li><li>spread: `model A {...B}`</li><li>intersection: `alias A = B & C`</li></ul> |

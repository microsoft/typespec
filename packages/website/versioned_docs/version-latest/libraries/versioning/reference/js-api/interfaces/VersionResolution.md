---
jsApi: true
title: "[I] VersionResolution"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `rootVersion` | `undefined` \| [`Version`](Version.md) | Version for the root namespace. `undefined` if not versioned. |
| `versions` | `Map`<`Namespace`, [`Version`](Version.md)\> | Resolved version for all the referenced namespaces. |

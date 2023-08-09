---
jsApi: true
title: "[F] resolveVersions"
---

```ts
resolveVersions(program, rootNs): VersionResolution[]
```

Resolve the version to use for all namespace for each of the root namespace versions.

## Parameters

| Parameter | Type        | Description     |
| :-------- | :---------- | :-------------- |
| `program` | `Program`   |                 |
| `rootNs`  | `Namespace` | Root namespace. |

## Returns

[`VersionResolution`](Interface.VersionResolution.md)[]

## Source

[versioning/src/versioning.ts:508](https://github.com/markcowl/cadl/blob/1a6d2b70/packages/versioning/src/versioning.ts#L508)

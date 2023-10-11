---
jsApi: true
title: "[I] ResolveModuleHost"

---
## Methods

### readFile()

```ts
readFile(path): Promise<string>
```

Read a utf-8 encoded file.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

***

### realpath()

```ts
realpath(path): Promise<string>
```

Resolve the real path for the current host.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

***

### stat()

```ts
stat(path): Promise<object>
```

Get information about the given path

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

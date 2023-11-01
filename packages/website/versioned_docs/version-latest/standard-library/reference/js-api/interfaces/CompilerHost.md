---
jsApi: true
title: "[I] CompilerHost"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `logSink` | [`LogSink`](LogSink.md) | - |
| `parseCache?` | `WeakMap`<[`SourceFile`](SourceFile.md), [`TypeSpecScriptNode`](TypeSpecScriptNode.md)\> | Optional cache to reuse the results of parsing and binding across programs. |

## Methods

### fileURLToPath()

```ts
fileURLToPath(url): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `url` | `string` |

***

### getExecutionRoot()

```ts
getExecutionRoot(): string
```

***

### getJsImport()

```ts
getJsImport(path): Promise<Record<string, any>>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

***

### getLibDirs()

```ts
getLibDirs(): string[]
```

***

### getSourceFileKind()

```ts
getSourceFileKind(path): undefined | SourceFileKind
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

***

### mkdirp()

```ts
mkdirp(path): Promise<undefined | string>
```

create directory recursively.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | Path to the directory. |

***

### pathToFileURL()

```ts
pathToFileURL(path): string
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

***

### readDir()

```ts
readDir(dir): Promise<string[]>
```

Read directory.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `dir` | `string` |

#### Returns

list of file/directory in the given directory. Returns the name not the full path.

***

### readFile()

```ts
readFile(path): Promise<SourceFile>
```

read a utf-8 or utf-8 with bom encoded file

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

***

### readUrl()

```ts
readUrl(url): Promise<SourceFile>
```

read a file at the given url.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `url` | `string` |

***

### realpath()

```ts
realpath(path): Promise<string>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

***

### rm()

```ts
rm(path, options?): Promise<void>
```

Deletes a directory or file.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | Path to the directory or file. |
| `options`? | [`RmOptions`](RmOptions.md) | - |

***

### stat()

```ts
stat(path): Promise<object>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |

***

### writeFile()

```ts
writeFile(path, content): Promise<void>
```

Write the file.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | Path to the file. |
| `content` | `string` | Content of the file. |

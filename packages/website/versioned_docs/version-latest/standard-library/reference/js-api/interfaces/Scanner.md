---
jsApi: true
title: "[I] Scanner"

---
## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `file` | [`SourceFile`](SourceFile.md) | The source code being scanned. |
| `readonly` | `position` | `number` | The offset in UTF-16 code units to the current position at the start of the next token. |
| `readonly` | `token` | [`Token`](../enumerations/Token.md) | The current token |
| `readonly` | `tokenFlags` | [`TokenFlags`](../enumerations/TokenFlags.md) | The flags on the current token. |
| `readonly` | `tokenPosition` | `number` | The offset in UTF-16 code units to the start of the current token. |

## Methods

### eof()

```ts
eof(): boolean
```

Determine if the scanner has reached the end of the input.

#### Returns

`boolean`

***

### getTokenText()

```ts
getTokenText(): string
```

The exact spelling of the current token.

#### Returns

`string`

***

### getTokenValue()

```ts
getTokenValue(): string
```

The value of the current token.

String literals are escaped and unquoted, identifiers are normalized,
and all other tokens return their exact spelling sames as
getTokenText().

#### Returns

`string`

***

### scan()

```ts
scan(): Token
```

Advance one token.

#### Returns

[`Token`](../enumerations/Token.md)

***

### scanDoc()

```ts
scanDoc(): DocToken
```

Advance one token inside DocComment. Use inside [scanRange](Scanner.md#scanrange) callback over DocComment range.

#### Returns

[`DocToken`](../type-aliases/DocToken.md)

***

### scanRange()

```ts
scanRange<T>(range, callback): T
```

Reset the scanner to the given start and end positions, invoke the callback, and then restore scanner state.

#### Type parameters

| Parameter |
| :------ |
| `T` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `range` | [`TextRange`](TextRange.md) |
| `callback` | () => `T` |

#### Returns

`T`

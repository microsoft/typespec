---
jsApi: true
title: "[I] Scanner"

---
## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `file` | `readonly` | [`SourceFile`](SourceFile.md) | The source code being scanned. |
| `position` | `readonly` | `number` | The offset in UTF-16 code units to the current position at the start of the next token. |
| `token` | `readonly` | [`Token`](../enumerations/Token.md) | The current token |
| `tokenFlags` | `readonly` | [`TokenFlags`](../enumerations/TokenFlags.md) | The flags on the current token. |
| `tokenPosition` | `readonly` | `number` | The offset in UTF-16 code units to the start of the current token. |

## Methods

### eof()

```ts
eof(): boolean
```

Determine if the scanner has reached the end of the input.

#### Returns

`boolean`

***

### findTripleQuotedStringIndent()

```ts
findTripleQuotedStringIndent(start, end): [number, number]
```

Finds the indent for the given triple quoted string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `start` | `number` |  |
| `end` | `number` |  |

#### Returns

[`number`, `number`]

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

### reScanStringTemplate()

```ts
reScanStringTemplate(tokenFlags): StringTemplateToken
```

Unconditionally back up and scan a template expression portion.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `tokenFlags` | [`TokenFlags`](../enumerations/TokenFlags.md) | Token Flags for head StringTemplateToken |

#### Returns

[`StringTemplateToken`](../type-aliases/StringTemplateToken.md)

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

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `range` | [`TextRange`](TextRange.md) |
| `callback` | () => `T` |

#### Returns

`T`

***

### unindentAndUnescapeTripleQuotedString()

```ts
unindentAndUnescapeTripleQuotedString(
   start, 
   end, 
   indentationStart, 
   indentationEnd, 
   token, 
   tokenFlags): string
```

Unindent and unescape the triple quoted string rawText

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `start` | `number` |
| `end` | `number` |
| `indentationStart` | `number` |
| `indentationEnd` | `number` |
| `token` | `StringLiteral` \| [`StringTemplateToken`](../type-aliases/StringTemplateToken.md) |
| `tokenFlags` | [`TokenFlags`](../enumerations/TokenFlags.md) |

#### Returns

`string`

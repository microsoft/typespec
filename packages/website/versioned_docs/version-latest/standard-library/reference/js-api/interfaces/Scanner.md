[JS Api](../index.md) / Scanner

# Interface: Scanner

## Table of contents

### Properties

- [file](Scanner.md#file)
- [position](Scanner.md#position)
- [token](Scanner.md#token)
- [tokenFlags](Scanner.md#tokenflags)
- [tokenPosition](Scanner.md#tokenposition)

### Methods

- [eof](Scanner.md#eof)
- [getTokenText](Scanner.md#gettokentext)
- [getTokenValue](Scanner.md#gettokenvalue)
- [scan](Scanner.md#scan)
- [scanDoc](Scanner.md#scandoc)
- [scanRange](Scanner.md#scanrange)

## Properties

### file

• `Readonly` **file**: [`SourceFile`](SourceFile.md)

The source code being scanned.

___

### position

• `Readonly` **position**: `number`

The offset in UTF-16 code units to the current position at the start of the next token.

___

### token

• `Readonly` **token**: [`Token`](../enums/Token.md)

The current token

___

### tokenFlags

• `Readonly` **tokenFlags**: [`TokenFlags`](../enums/TokenFlags.md)

The flags on the current token.

___

### tokenPosition

• `Readonly` **tokenPosition**: `number`

The offset in UTF-16 code units to the start of the current token.

## Methods

### eof

▸ **eof**(): `boolean`

Determine if the scanner has reached the end of the input.

#### Returns

`boolean`

___

### getTokenText

▸ **getTokenText**(): `string`

The exact spelling of the current token.

#### Returns

`string`

___

### getTokenValue

▸ **getTokenValue**(): `string`

The value of the current token.

String literals are escaped and unquoted, identifiers are normalized,
and all other tokens return their exact spelling sames as
getTokenText().

#### Returns

`string`

___

### scan

▸ **scan**(): [`Token`](../enums/Token.md)

Advance one token.

#### Returns

[`Token`](../enums/Token.md)

___

### scanDoc

▸ **scanDoc**(): [`DocToken`](../index.md#doctoken)

Advance one token inside DocComment. Use inside [scanRange](Scanner.md#scanrange) callback over DocComment range.

#### Returns

[`DocToken`](../index.md#doctoken)

___

### scanRange

▸ **scanRange**<`T`\>(`range`, `callback`): `T`

Reset the scanner to the given start and end positions, invoke the callback, and then restore scanner state.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `range` | [`TextRange`](TextRange.md) |
| `callback` | () => `T` |

#### Returns

`T`

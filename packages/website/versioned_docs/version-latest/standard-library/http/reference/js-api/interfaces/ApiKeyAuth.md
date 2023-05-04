[JS Api](../index.md) / ApiKeyAuth

# Interface: ApiKeyAuth<TLocation, TName\>

An API key is a token that a client provides when making API calls. The key can be sent in the query string:
```
GET /something?api_key=abcdef12345
```

or as a request header

```
GET /something HTTP/1.1
X-API-Key: abcdef12345
```

or as a cookie

```
GET /something HTTP/1.1
Cookie: X-API-KEY=abcdef12345
```

## Type parameters

| Name | Type |
| :------ | :------ |
| `TLocation` | extends `ApiKeyLocation` |
| `TName` | extends `string` |

## Hierarchy

- [`HttpAuthBase`](HttpAuthBase.md)

  ↳ **`ApiKeyAuth`**

## Table of contents

### Properties

- [description](ApiKeyAuth.md#description)
- [id](ApiKeyAuth.md#id)
- [in](ApiKeyAuth.md#in)
- [name](ApiKeyAuth.md#name)
- [type](ApiKeyAuth.md#type)

## Properties

### description

• `Optional` **description**: `string`

Optional description.

#### Inherited from

[HttpAuthBase](HttpAuthBase.md).[description](HttpAuthBase.md#description)

___

### id

• **id**: `string`

Id of the authentication scheme.

#### Inherited from

[HttpAuthBase](HttpAuthBase.md).[id](HttpAuthBase.md#id)

___

### in

• **in**: `TLocation`

___

### name

• **name**: `TName`

___

### type

• **type**: ``"apiKey"``

[Documentation](../index.md) / [http](../modules/http.md) / ApiKeyAuth

# Interface: ApiKeyAuth<TLocation, TName\>

[http](../modules/http.md).ApiKeyAuth

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

- [`HttpAuthBase`](http.HttpAuthBase.md)

  ↳ **`ApiKeyAuth`**

## Table of contents

### Properties

- [description](http.ApiKeyAuth.md#description)
- [id](http.ApiKeyAuth.md#id)
- [in](http.ApiKeyAuth.md#in)
- [name](http.ApiKeyAuth.md#name)
- [type](http.ApiKeyAuth.md#type)

## Properties

### description

• `Optional` **description**: `string`

Optional description.

#### Inherited from

[HttpAuthBase](http.HttpAuthBase.md).[description](http.HttpAuthBase.md#description)

___

### id

• **id**: `string`

Id of the authentication scheme.

#### Inherited from

[HttpAuthBase](http.HttpAuthBase.md).[id](http.HttpAuthBase.md#id)

___

### in

• **in**: `TLocation`

___

### name

• **name**: `TName`

___

### type

• **type**: ``"apiKey"``

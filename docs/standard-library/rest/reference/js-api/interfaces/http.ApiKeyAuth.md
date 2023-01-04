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

#### Defined in

[http/types.ts:46](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L46)

___

### id

• **id**: `string`

Id of the authentication scheme.

#### Inherited from

[HttpAuthBase](http.HttpAuthBase.md).[id](http.HttpAuthBase.md#id)

#### Defined in

[http/types.ts:41](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L41)

___

### in

• **in**: `TLocation`

#### Defined in

[http/types.ts:100](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L100)

___

### name

• **name**: `TName`

#### Defined in

[http/types.ts:101](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L101)

___

### type

• **type**: ``"apiKey"``

#### Defined in

[http/types.ts:99](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/http/types.ts#L99)

---
jsApi: true
title: "[I] ApiKeyAuth"

---
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

## Extends

- [`HttpAuthBase`](HttpAuthBase.md)

## Type parameters

| Parameter |
| :------ |
| `TLocation` extends `ApiKeyLocation` |
| `TName` extends `string` |

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `description?` | `string` | Optional description. | [`HttpAuthBase`](HttpAuthBase.md).`description` |
| `id` | `string` | Id of the authentication scheme. | [`HttpAuthBase`](HttpAuthBase.md).`id` |
| `in` | `TLocation` | - | - |
| `name` | `TName` | - | - |
| `type` | `"apiKey"` | - | - |

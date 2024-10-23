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

## Type Parameters

| Type Parameter |
| ------ |
| `TLocation` *extends* `ApiKeyLocation` |
| `TName` *extends* `string` |

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| `description?` | `public` | `string` | Optional description. | [`HttpAuthBase`](HttpAuthBase.md).`description` |
| `id` | `public` | `string` | Id of the authentication scheme. | [`HttpAuthBase`](HttpAuthBase.md).`id` |
| `in` | `public` | `TLocation` | - | - |
| `model` | `readonly` | `Model` | Model that defined the authentication | [`HttpAuthBase`](HttpAuthBase.md).`model` |
| `name` | `public` | `TName` | - | - |
| `type` | `public` | `"apiKey"` | - | - |

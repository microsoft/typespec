---
jsApi: true
title: "[I] BasicAuth"

---
Basic authentication is a simple authentication scheme built into the HTTP protocol.
The client sends HTTP requests with the Authorization header that contains the word Basic word followed by a space and a base64-encoded string username:password.
For example, to authorize as demo / p@55w0rd the client would send
```
 Authorization: Basic ZGVtbzpwQDU1dzByZA==
```

## Extends

- [`HttpAuthBase`](Interface.HttpAuthBase.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `description`? | `string` | Optional description. |
| `id` | `string` | Id of the authentication scheme. |
| `scheme` | `"basic"` | - |
| `type` | `"http"` | - |

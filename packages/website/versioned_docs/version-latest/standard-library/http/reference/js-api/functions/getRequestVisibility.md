---
jsApi: true
title: "[F] getRequestVisibility"

---
```ts
getRequestVisibility(verb): Visibility
```

Determines the visibility to use for a request with the given verb.

- GET | HEAD => Visibility.Query
- POST => Visibility.Create
- PATCH => Visibility.Update
- PUT => Visibility.Create | Update
- DELETE => Visibility.Delete

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `verb` | [`HttpVerb`](../type-aliases/HttpVerb.md) | The HTTP verb for the operation. |

## Returns

The applicable parameter visibility or visibilities for the request.

## Deprecated

Use `resolveRequestVisibility` instead, or if you only want the default visibility for a verb, `getDefaultVisibilityForVerb`.

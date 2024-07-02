---
jsApi: true
title: "[F] resolveAuthentication"

---
```ts
function resolveAuthentication(service): HttpServiceAuthentication
```

Compute the authentication for a given service.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `service` | [`HttpService`](../interfaces/HttpService.md) | Http Service |

## Returns

[`HttpServiceAuthentication`](../interfaces/HttpServiceAuthentication.md)

The normalized authentication for a service.

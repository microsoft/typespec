---
jsApi: true
title: "[I] HttpOperationResponse"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `description?` | `string` | Response description. |
| `responses` | [`HttpOperationResponseContent`](HttpOperationResponseContent.md)[] | Responses contents. |
| `statusCode` | [`StatusCode`](../type-aliases/StatusCode.md) | **Deprecated**<br /><br />use [statusCodes](HttpOperationResponse.md) |
| `statusCodes` | `number` \| `"*"` \| [`HttpStatusCodeRange`](HttpStatusCodeRange.md) | Status code or range of status code for the response. |
| `type` | `Type` | Response typespec type. |

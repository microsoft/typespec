---
jsApi: true
title: "[I] HttpOperationParameters"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `body`? | [`HttpOperationRequestBody`](Interface.HttpOperationRequestBody.md) | - |
| `bodyParameter`? | `ModelProperty` | **Deprecated**<br /><br />use body.parameter |
| `bodyType`? | `Type` | **Deprecated**<br /><br />use body.type |
| `parameters` | [`HttpOperationParameter`](Type.HttpOperationParameter.md)[] | - |
| `verb` | [`HttpVerb`](Type.HttpVerb.md) | NOTE: The verb is determined when processing parameters as it can<br />depend on whether there is a request body if not explicitly specified.<br />Marked internal to keep from polluting the public API with the verb at<br />two levels. |

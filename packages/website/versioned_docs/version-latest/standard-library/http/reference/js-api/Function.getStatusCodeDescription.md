---
jsApi: true
title: "[F] getStatusCodeDescription"

---
```ts
getStatusCodeDescription(statusCode): undefined | "The request has succeeded." | "The request has succeeded and a new resource has been created as a result." | "The request has been accepted for processing, but processing has not yet completed." | "There is no content to send for this request, but the headers may be useful. " | "The URL of the requested resource has been changed permanently. The new URL is given in the response." | "The client has made a conditional request and the resource has not been modified." | "The server could not understand the request due to invalid syntax." | "Access is unauthorized." | "Access is forbidden" | "The server cannot find the requested resource." | "The request conflicts with the current state of the server." | "Precondition failed." | "Service unavailable." | "Informational" | "Successful" | "Redirection" | "Client Error" | "Server Error"
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `statusCode` | `string` |

## Returns

`undefined` \| `"The request has succeeded."` \| `"The request has succeeded and a new resource has been created as a result."` \| `"The request has been accepted for processing, but processing has not yet completed."` \| `"There is no content to send for this request, but the headers may be useful. "` \| `"The URL of the requested resource has been changed permanently. The new URL is given in the response."` \| `"The client has made a conditional request and the resource has not been modified."` \| `"The server could not understand the request due to invalid syntax."` \| `"Access is unauthorized."` \| `"Access is forbidden"` \| `"The server cannot find the requested resource."` \| `"The request conflicts with the current state of the server."` \| `"Precondition failed."` \| `"Service unavailable."` \| `"Informational"` \| `"Successful"` \| `"Redirection"` \| `"Client Error"` \| `"Server Error"`

# Should emit serializer and deserializer correctly for properties with primitive array type

## Typespec

```tsp
namespace Test;
model FileSpecificContentType extends File {
  filename: string;
  contentType: "image/jpg";
}

model FileWithHttpPartSpecificContentTypeRequest {
  profileImage: HttpPart<FileSpecificContentType>;
}

@post op create(
  @header contentType: "multipart/form-data",
  @multipartBody body: FileWithHttpPartSpecificContentTypeRequest,
): NoContentResponse;
```

## TypeScript

Should generate a model `FileWithHttpPartSpecificContentTypeRequest` and also a `fileWithHttpPartSpecificContentTypeRequestToTransport` and `fileWithHttpPartSpecificContentTypeRequestToApplication`.

```ts src/models/models.ts interface FileSpecificContentType
export interface FileSpecificContentType extends File {
  filename: string;
  contentType: "image/jpg";
}
```

```ts src/models/models.ts interface FileWithHttpPartSpecificContentTypeRequest
export interface FileWithHttpPartSpecificContentTypeRequest {
  profileImage: FileSpecificContentType;
}
```

```ts src/api/testClientOperations.ts function create
export async function create(
  client: TestClientContext,
  body: FileWithHttpPartSpecificContentTypeRequest,
  options?: CreateOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "multipart/form-data",
    },
    body: [createFilePartDescriptor("profileImage", body.profileImage, "image/jpg")],
  };
  const response = await client.pathUnchecked(path).post(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

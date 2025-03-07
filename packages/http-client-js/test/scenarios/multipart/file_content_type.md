# Should handle part files with specific content type

```tsp
namespace Test;
model FileSpecificContentType extends File {
  filename: string;
  contentType: "image/jpg";
}

model FileWithHttpPartSpecificContentTypeRequest {
  profileImage: HttpPart<FileSpecificContentType>;
}

@post
@route("/check-filename-and-specific-content-type-with-httppart")
op imageJpegContentType(
  @header contentType: "multipart/form-data",
  @multipartBody body: FileWithHttpPartSpecificContentTypeRequest,
): NoContentResponse;
```

## Operations

```ts src/api/testClientOperations.ts function imageJpegContentType
export async function imageJpegContentType(
  client: TestClientContext,
  body: FileWithHttpPartSpecificContentTypeRequest,
  options?: ImageJpegContentTypeOptions,
): Promise<void> {
  const path = parse("/check-filename-and-specific-content-type-with-httppart").expand({});

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

## Serializers

```ts src/models/serializers.ts function jsonFileWithHttpPartSpecificContentTypeRequestToApplicationTransform
export function jsonFileWithHttpPartSpecificContentTypeRequestToApplicationTransform(
  input_?: any,
): FileWithHttpPartSpecificContentTypeRequest {
  if (!input_) {
    return input_ as any;
  }

  return {
    profileImage: jsonFileSpecificContentTypeToApplicationTransform(input_.profileImage),
  }!;
}
```

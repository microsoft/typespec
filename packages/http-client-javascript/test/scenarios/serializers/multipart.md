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

```ts src/models/serializers.ts function createPayloadToTransport
export function createPayloadToTransport(payload: FileWithHttpPartSpecificContentTypeRequest) {
  return [createFilePartDescriptor("profileImage", payload, "image/jpg")];
}
```

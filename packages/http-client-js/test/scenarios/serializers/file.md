# Should handle File Parts

```tsp
@service
namespace Test;

model FileSpecificContentType extends File {
  filename: string;
  contentType: "image/jpg";
}

model FileWithHttpPartSpecificContentTypeRequest {
  profileImage: HttpPart<FileSpecificContentType>;
}

@post
op imageJpegContentType(
  @header contentType: "multipart/form-data",
  @multipartBody body: FileWithHttpPartSpecificContentTypeRequest,
): NoContentResponse;
```

## Serializers

```ts src/models/internal/serializers.ts function jsonFileSpecificContentTypeToApplicationTransform
export function jsonFileSpecificContentTypeToApplicationTransform(
  input_?: any,
): FileSpecificContentType {
  if (!input_) {
    return input_ as any;
  }
  return {
    filename: input_.filename,
    contentType: input_.contentType,
    contents: input_.contents,
  }!;
}
```

```ts src/models/internal/serializers.ts function jsonFileSpecificContentTypeToTransportTransform
export function jsonFileSpecificContentTypeToTransportTransform(
  input_?: FileSpecificContentType | null,
): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    filename: input_.filename,
    contentType: input_.contentType,
    contents: input_.contents,
  }!;
}
```

It shouldn't try to base64 encode the contents

```ts src/models/internal/serializers.ts function jsonFileToTransportTransform
export function jsonFileToTransportTransform(input_?: File | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    contentType: input_.contentType,
    filename: input_.filename,
    contents: input_.contents,
  }!;
}
```

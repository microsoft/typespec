# Basic file part

```tsp
namespace Test;

model RequestBody {
  basicFile: HttpPart<File>;
}

op doThing(@header contentType: "multipart/form-data", @multipartBody bodyParam: RequestBody): void;
```

## Models

This basic case uses TypeSpec's `Http.File`, which specifies an optional `filename` and `contentType`.

```ts src/models/models.ts interface RequestBody
export interface RequestBody {
  basicFile: File;
}

```

## Operations

```ts src/api/operations.ts function doThing
export async function doThing(
  client: TestClientContext,
  bodyParam: RequestBody,
): Promise<void> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {
      "content-type": "multipart/form-data",
    },
    body: doThingPayloadToTransport(bodyParam),
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}

```

## Serializer

```ts src/models/serializers.ts function doThingPayloadToTransport
export function doThingPayloadToTransport(payload: RequestBody) {
  return [createFilePartDescriptor("basicFile", payload)];
}

```

# Default content type

```tsp
namespace Test;

model PngFile extends File {
  contentType: "image/png";
}

model RequestBody {
  image: HttpPart<PngFile>;
}

op doThing(@header contentType: "multipart/form-data", @multipartBody bodyParam: RequestBody): void;
```

## Models

```ts src/models/models.ts interface PngFile
export interface PngFile extends File {
  contentType: "image/png";
}

```

```ts src/models/models.ts interface RequestBody
export interface RequestBody {
  image: PngFile;
}

```

## Serializers

```ts src/models/serializers.ts function doThingPayloadToTransport
export function doThingPayloadToTransport(payload: RequestBody) {
  return [createFilePartDescriptor("image", payload, "image/png")];
}

```

# Multiple files

```tsp
namespace Test;

model RequestBody {
  files: HttpPart<File>[];
}

op doThing(@header contentType: "multipart/form-data", @multipartBody bodyParam: RequestBody): void;
```

## Models

Each provided file in the input corresponds to one part in the multipart request.

```ts src/models/models.ts interface RequestBody
export interface RequestBody {
  files: Array<File>;
}

```

## Serializer

```ts src/models/serializers.ts function doThingPayloadToTransport
export function doThingPayloadToTransport(payload: RequestBody) {
  return [
    ...payload.files.map((x: any) => createFilePartDescriptor("files", x)),
  ];
}

```

## Operation

```ts src/api/operations.ts function doThing
export async function doThing(
  client: TestClientContext,
  bodyParam: RequestBody,
): Promise<void> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {
      "content-type": "multipart/form-data",
    },
    body: doThingPayloadToTransport(bodyParam),
  };

  const response = await client.path(path).post(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}

```

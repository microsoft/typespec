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

```ts src/api/testClientOperations.ts function doThing
export async function doThing(
  client: TestClientContext,
  bodyParam: RequestBody,
  options?: DoThingOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "multipart/form-data",
    },
    body: [createFilePartDescriptor("basicFile", bodyParam.basicFile)],
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

# With part content type

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

## Operation

```ts src/api/testClientOperations.ts function doThing
export async function doThing(
  client: TestClientContext,
  bodyParam: RequestBody,
  options?: DoThingOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "multipart/form-data",
    },
    body: [createFilePartDescriptor("image", bodyParam.image, "image/png")],
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

## Operation

```ts src/api/testClientOperations.ts function doThing
export async function doThing(
  client: TestClientContext,
  bodyParam: RequestBody,
  options?: DoThingOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "multipart/form-data",
    },
    body: [...bodyParam.files.map((files: any) => createFilePartDescriptor("files", files))],
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

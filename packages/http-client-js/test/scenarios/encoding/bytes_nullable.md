# Handle encoding with nullable bytes

A spec that has an operation that uses a model with a nullable bytes property.

```tsp
@service
namespace Test;
model ModelWithBytes {
  requiredProperty: string;
  nullableProperty: bytes | null;
}

@get op get(): ModelWithBytes;
@put op put(...ModelWithBytes): void;
@post op post(body: ModelWithBytes): void;
```

## Get

### Operation

Should call the Json To Application transport for the ModelWith Bytes

```ts src/api/testClientOperations.ts function get
export async function get(
  client: TestClientContext,
  options?: GetOptions,
): Promise<ModelWithBytes> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonModelWithBytesToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
```

### Deserializer

Should decode as uint8array the nullableProperty

```ts src/models/internal/serializers.ts function jsonModelWithBytesToApplicationTransform
export function jsonModelWithBytesToApplicationTransform(input_?: any): ModelWithBytes {
  if (!input_) {
    return input_ as any;
  }
  return {
    requiredProperty: input_.requiredProperty,
    nullableProperty: decodeBase64(input_.nullableProperty)!,
  }!;
}
```

## Put

### Operation

Should call encode the nullable property when building the body as base64

```ts src/api/testClientOperations.ts function put
export async function put(
  client: TestClientContext,
  requiredProperty: string,
  nullableProperty: Uint8Array | null,
  options?: PutOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      requiredProperty: requiredProperty,
      nullableProperty: encodeUint8Array(nullableProperty, "base64")!,
    },
  };
  const response = await client.pathUnchecked(path).put(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

## Post

### Operation

Should call encode the JSON to Transport application transform function and pass the model

```ts src/api/testClientOperations.ts function post
export async function post(
  client: TestClientContext,
  body: ModelWithBytes,
  options?: PostOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      body: jsonModelWithBytesToTransportTransform(body),
    },
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

### Serializer

Should encode as base64 the nullableProperty

```ts src/models/internal/serializers.ts function jsonModelWithBytesToTransportTransform
export function jsonModelWithBytesToTransportTransform(input_?: ModelWithBytes | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    requiredProperty: input_.requiredProperty,
    nullableProperty: encodeUint8Array(input_.nullableProperty, "base64")!,
  }!;
}
```

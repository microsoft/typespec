# Should populate a bytes header parameter

This scenario tests that a Bytes header parameter is sent correctly to the wire. Without any explicit encoding, the default is to encode as base64

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op defaultEncoding(
  @header
  value: bytes,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function defaultEncoding
export async function defaultEncoding(
  client: TestClientContext,
  value: Uint8Array,
  options?: DefaultEncodingOptions,
): Promise<void> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {
      value: encodeUint8Array(value, "base64")!,
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

# Should populate a bytes header parameter when the param is optional

This scenario tests that a bytes header parameter which is optional, is sent correctly to the wire. Without any explicit encoding, the default is to encode as base64url

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op defaultEncoding(
  @header
  value?: bytes,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function defaultEncoding
export async function defaultEncoding(
  client: TestClientContext,
  options?: DefaultEncodingOptions,
): Promise<void> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {
      ...(options?.value && {
        value: encodeUint8Array(options?.value, "base64")!,
      }),
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

# Should populate a bytes header parameter with explicit encoding base64

This scenario tests that a bytes header parameter is sent correctly to the wire. Explicitly setting encoding to base65

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op get(
  @header
  @encode("base64")
  value: bytes,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function get
export async function get(
  client: TestClientContext,
  value: Uint8Array,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {
      value: encodeUint8Array(value, "base64")!,
    },
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 204 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

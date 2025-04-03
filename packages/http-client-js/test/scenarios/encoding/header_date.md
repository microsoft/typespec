# Should populate a Date header parameter

This scenario tests that a Date header parameter is sent correctly to the wire. Without any explicit encoding, the default is to encode as rfc3339

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op defaultEncoding(
  @header
  value: utcDateTime,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function defaultEncoding
export async function defaultEncoding(
  client: TestClientContext,
  value: Date,
  options?: DefaultEncodingOptions,
): Promise<void> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {
      value: dateRfc7231Serializer(value),
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

# Should populate a Date header parameter when the param is optional

This scenario tests that a Date header parameter which is optional, is sent correctly to the wire. Without any explicit encoding, the default is to encode as rfc3339

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op defaultEncoding(
  @header
  value?: utcDateTime,
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
      ...(options?.value && { value: dateRfc7231Serializer(options.value) }),
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

# Should populate a Date header parameter with explicit encoding rfc3339

This scenario tests that a Date header parameter is sent correctly to the wire. Explicitly setting encoding to rfc3339

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op get(
  @header
  @encode(DateTimeKnownEncoding.rfc3339)
  value: utcDateTime,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function get
export async function get(
  client: TestClientContext,
  value: Date,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {
      value: dateRfc3339Serializer(value),
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

# Should populate a Date header parameter with explicit encoding rfc7231

This scenario tests that a Date header parameter is sent correctly to the wire. Explicit encode set to rfc7231

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op get(
  @header
  @encode(DateTimeKnownEncoding.rfc7231)
  value: utcDateTime,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function get
export async function get(
  client: TestClientContext,
  value: Date,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {
      value: dateRfc7231Serializer(value),
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

# Should populate a Date header parameter with explicit encoding Unix Timestamp

This scenario tests that a Date header parameter is sent correctly to the wire. Explicit encode set to unix timestamp

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op get(
  @header
  @encode("unixTimestamp", int64)
  value: utcDateTime,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function get
export async function get(
  client: TestClientContext,
  value: Date,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/default").expand({});
  const httpRequestOptions = {
    headers: {
      value: dateUnixTimestampSerializer(value),
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

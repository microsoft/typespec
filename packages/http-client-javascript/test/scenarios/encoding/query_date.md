# Should populate a Date query parameter

This scenario tests that a Date query parameter is sent correctly to the wire. Without any explicit encoding, the default is to encode as rfc3339

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op defaultEncoding(
  @query
  value: utcDateTime,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function defaultEncoding
export async function defaultEncoding(client: TestClientContext, value: Date): Promise<void> {
  const path = parse("/default{?value}").expand({
    value: dateRfc3339Serializer(value),
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

# Should populate a Date query parameter with explicit encoding rfc3339

This scenario tests that a Date query parameter is sent correctly to the wire. Explicitly setting encoding to rfc3339

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op get(
  @query
  @encode(DateTimeKnownEncoding.rfc3339)
  value: utcDateTime,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function get
export async function get(client: TestClientContext, value: Date): Promise<void> {
  const path = parse("/default{?value}").expand({
    value: dateRfc3339Serializer(value),
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

# Should populate a Date query parameter with explicit encoding rfc7231

This scenario tests that a Date query parameter is sent correctly to the wire. Explicit encode set to rfc7231

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op get(
  @query
  @encode(DateTimeKnownEncoding.rfc7231)
  value: utcDateTime,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function get
export async function get(client: TestClientContext, value: Date): Promise<void> {
  const path = parse("/default{?value}").expand({
    value: dateRfc7231Serializer(value),
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

# Should populate a Date query parameter with explicit encoding Unix Timestamp

This scenario tests that a Date query parameter is sent correctly to the wire. Explicit encode set to unix timestamp

## TypeSpec

```tsp
@service
namespace Test;

@route("/default")
op get(
  @query
  @encode("unixTimestamp", int64)
  value: utcDateTime,
): NoContentResponse;
```

## TypeScript

```ts src/api/testClientOperations.ts function get
export async function get(client: TestClientContext, value: Date): Promise<void> {
  const path = parse("/default{?value}").expand({
    value: dateUnixTimestampSerializer(value),
  });

  const httpRequestOptions = {
    headers: {},
  };

  const response = await client.path(path).get(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

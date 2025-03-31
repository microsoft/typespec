# only: Should generate as bytes for jsonl content type with httpstream template

## TypeSpec

This TypeSpec block defines a simple model, Foo, containing two properties: name (a string) and age (an integer). The foo operation returns an instance of Foo, ensuring that the generated TypeScript code includes the correct type definitions and transformation functions.

```tsp
@route("/")
op get(stream: HttpStream<Thing, "application/jsonl", string>): void;
model Thing {
  id: string;
}
```

## TypeScript

### Request

The test expects a TypeScript operation that treats the model Thing as bytes.

```ts src/api/clientOperations.ts function get
export async function get(
  client: ClientContext,
  stream: Uint8Array,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      stream: encodeUint8Array(stream, "base64")!,
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

# only: Should generate as bytes for jsonl streams template

## TypeSpec

This TypeSpec block defines a simple model, Foo, containing two properties: name (a string) and age (an integer). The foo operation returns an instance of Foo, ensuring that the generated TypeScript code includes the correct type definitions and transformation functions.

```tsp
@route("/")
op get(stream: JsonlStream<Thing>): void;
model Thing {
  id: string;
}
```

## TypeScript

### Request

The test expects a TypeScript operation that treats the model Thing as bytes.

```ts src/api/clientOperations.ts function get
export async function get(
  client: ClientContext,
  stream: Uint8Array,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: {
      stream: encodeUint8Array(stream, "base64")!,
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

# only: Should generate as bytes for jsonl streams spread

## TypeSpec

This TypeSpec block defines a simple model, Foo, containing two properties: name (a string) and age (an integer). The foo operation returns an instance of Foo, ensuring that the generated TypeScript code includes the correct type definitions and transformation functions.

```tsp
@route("/")
op get(...JsonlStream<Thing>): void;
model Thing {
  id: string;
}
```

## TypeScript

### Request

The test expects a TypeScript operation that treats the model Thing as bytes.

```ts src/api/clientOperations.ts function get
export async function get(
  client: ClientContext,
  body: string,
  options?: GetOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "application/jsonl",
    },
    body: body,
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

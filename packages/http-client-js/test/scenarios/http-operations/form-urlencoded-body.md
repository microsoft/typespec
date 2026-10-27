# Should URL-encode an application/x-www-form-urlencoded request body

`application/x-www-form-urlencoded` bodies are sent as a query string built with `URLSearchParams`, not as JSON.

```tsp
@service
namespace Test;

@post op create(
  @header contentType: "application/x-www-form-urlencoded",
  @body body: Record<string>,
): void;
```

## Operation

```ts src/api/testClientOperations.ts function create
export async function create(
  client: TestClientContext,
  body: Record<string, string>,
  options?: CreateOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "application/x-www-form-urlencoded",
    },
    body: encodeFormUrlEncoded(jsonRecordStringToTransportTransform(body)),
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

## Form encoder

Absent values are skipped. Arrays repeat the key. Nested objects are JSON-encoded so they are not stringified as `[object Object]`.

```ts src/helpers/form-urlencoded.ts function encodeFormUrlEncoded
export function encodeFormUrlEncoded(
  input?: Record<string, unknown> | null,
): string | null | undefined {
  if (input == null) {
    return input;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) {
          continue;
        }
        params.append(key, typeof item === "object" ? JSON.stringify(item) : String(item));
      }
      continue;
    }
    params.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }
  return params.toString();
}
```

# Should URL-encode a model form body

```tsp
@service
namespace Test;

model Widget {
  name: string;
  qty: int32;
  tag: string[];
  note?: string;
}

@post op submit(
  @header contentType: "application/x-www-form-urlencoded",
  @body widget: Widget,
): void;
```

## Operation

```ts src/api/testClientOperations.ts function submit
export async function submit(
  client: TestClientContext,
  widget: Widget,
  options?: SubmitOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "application/x-www-form-urlencoded",
    },
    body: encodeFormUrlEncoded(jsonWidgetToTransportTransform(widget)),
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

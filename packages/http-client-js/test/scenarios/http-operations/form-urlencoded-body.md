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
      "content-type":
        options?.contentType ?? "application/x-www-form-urlencoded",
    },
    body: encodeFormUrlEncoded(
      formUrlEncodedRecordStringToTransportTransform(body),
    ),
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
        params.append(
          key,
          typeof item === "object" ? JSON.stringify(item) : String(item),
        );
      }
      continue;
    }
    params.append(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
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
      "content-type":
        options?.contentType ?? "application/x-www-form-urlencoded",
    },
    body: encodeFormUrlEncoded(
      formUrlEncodedWidgetToTransportTransform(widget),
    ),
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

# Should URL-encode a nullable model form body

Nullable `@body` properties keep a union type; the client still form-encodes non-null values.

```tsp
@service
namespace Test;

model Widget {
  name: string;
}

@post op submitNullable(
  @header contentType: "application/x-www-form-urlencoded",
  @body widget: Widget | null,
): void;
```

## Operation

```ts src/api/testClientOperations.ts function submitNullable
export async function submitNullable(
  client: TestClientContext,
  widget: Widget | null,
  options?: SubmitNullableOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type":
        options?.contentType ?? "application/x-www-form-urlencoded",
    },
    body: encodeFormUrlEncoded(widget),
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

# Should use form encoded names when charset is specified on the content type

```tsp
@service
namespace Test;

model Widget {
  @encodedName("application/x-www-form-urlencoded", "form_name")
  name: string;
}

@post op submitWithCharset(
  @header contentType: "application/x-www-form-urlencoded; charset=UTF-8",
  @body widget: Widget,
): void;
```

## Serializer

```ts src/models/internal/serializers.ts function formUrlEncodedWidgetToTransportTransform
export function formUrlEncodedWidgetToTransportTransform(
  input_?: Widget | null,
): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    form_name: input_.name,
  }!;
}
```

## Operation

```ts src/api/testClientOperations.ts function submitWithCharset
export async function submitWithCharset(
  client: TestClientContext,
  widget: Widget,
  options?: SubmitWithCharsetOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type":
        options?.contentType ??
        "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: encodeFormUrlEncoded(
      formUrlEncodedWidgetToTransportTransform(widget),
    ),
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

# Should keep JSON and form serializers separate for shared models

```tsp
@service
namespace Test;

model Shared {
  @encodedName("application/json", "jsonName")
  @encodedName("application/x-www-form-urlencoded", "formName")
  label: string;
}

@post @route("/json") op postJson(@body body: Shared): void;

@post @route("/form") op postForm(
  @header contentType: "application/x-www-form-urlencoded",
  @body body: Shared,
): void;
```

## JSON serializer

```ts src/models/internal/serializers.ts function jsonSharedToTransportTransform
export function jsonSharedToTransportTransform(input_?: Shared | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    jsonName: input_.label,
  }!;
}
```

## Form serializer

```ts src/models/internal/serializers.ts function formUrlEncodedSharedToTransportTransform
export function formUrlEncodedSharedToTransportTransform(
  input_?: Shared | null,
): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    formName: input_.label,
  }!;
}
```

## Form operation

```ts src/api/testClientOperations.ts function postForm
export async function postForm(
  client: TestClientContext,
  body: Shared,
  options?: PostFormOptions,
): Promise<void> {
  const path = parse("/form").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type":
        options?.contentType ?? "application/x-www-form-urlencoded",
    },
    body: encodeFormUrlEncoded(formUrlEncodedSharedToTransportTransform(body)),
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

## JSON operation

```ts src/api/testClientOperations.ts function postJson
export async function postJson(
  client: TestClientContext,
  body: Shared,
  options?: PostJsonOptions,
): Promise<void> {
  const path = parse("/json").expand({});
  const httpRequestOptions = {
    headers: {},
    body: jsonSharedToTransportTransform(body),
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

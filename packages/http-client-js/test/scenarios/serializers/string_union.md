# Should handle operations with string union input

## Typespec

```tsp
@service(#{ title: "Test Service" })
namespace Test;
union ServerExtensibleEnum {
  string,
  EnumValue1: "value1",
}

@post
op unionEnumName(@body body: ServerExtensibleEnum): NoContentResponse;
```

## Typescript

```ts src/models/models.ts type ServerExtensibleEnum
export type ServerExtensibleEnum = string | "value1";
```

```ts src/api/testClientOperations.ts function unionEnumName
export async function unionEnumName(
  client: TestClientContext,
  body: ServerExtensibleEnum,
  options?: UnionEnumNameOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
    body: jsonServerExtensibleEnumToTransportTransform(body),
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

```ts src/models/internal/serializers.ts function jsonServerExtensibleEnumToTransportTransform
export function jsonServerExtensibleEnumToTransportTransform(
  input_?: ServerExtensibleEnum | null,
): any {
  if (!input_) {
    return input_ as any;
  }
  return input_;
}
```

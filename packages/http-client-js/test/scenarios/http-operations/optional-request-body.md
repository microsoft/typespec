# Should handle a request with an optional body

```tsp
namespace Test;
model BodyModel {
  name: string;
}

@route("/set")
@post
op set(@body body?: BodyModel): NoContentResponse;

@route("/omit")
@post
op omit(@body body?: BodyModel): NoContentResponse;
```

## Operations

```ts src/api/testClientOperations.ts function set
export async function set(client: TestClientContext, options?: SetOptions): Promise<void> {
  const path = parse("/set").expand({});
  const httpRequestOptions = {
    headers: {},
    body: jsonBodyModelToTransportTransform(options?.body),
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

## Transform

```ts src/models/internal/serializers.ts function jsonBodyModelToTransportTransform
export function jsonBodyModelToTransportTransform(input_?: BodyModel | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    name: input_.name,
  }!;
}
```

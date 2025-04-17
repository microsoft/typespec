# Should handle a header parameter within @bodyRoot

```tsp
namespace Test;

model VisibilityModel {
  id: string;
  name: string;
  age?: string;
  @header foo?: string;
}

@head op headModel(@bodyRoot input: VisibilityModel): OkResponse;
```

## Operation

```ts src/api/testClientOperations.ts function headModel
export async function headModel(
  client: TestClientContext,
  input: VisibilityModel,
  options?: HeadModelOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      ...(input.foo && { foo: input.foo }),
    },
    body: jsonVisibilityModelToTransportTransform(input),
  };
  const response = await client.pathUnchecked(path).head(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (+response.status === 200 && !response.body) {
    return;
  }
  throw createRestError(response);
}
```

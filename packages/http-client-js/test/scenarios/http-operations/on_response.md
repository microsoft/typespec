# Should call on response after receiving the response from the service.

## TypeSpec

```tsp
@service
namespace Test;
model Widget {
  id: string;
  total_weight: int32;
  color: "red" | "blue";
  is_required?: boolean;
}

@post op foo(...Widget): void;
```

## TypeScript

### Operation

Generates a function that call the onResponse callback

```ts src/api/testClientOperations.ts function foo
export async function foo(
  client: TestClientContext,
  id: string,
  totalWeight: number,
  color: "red" | "blue",
  options?: FooOptions,
): Promise<void> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {},
    body: {
      id: id,
      total_weight: totalWeight,
      color: color,
      is_required: options?.isRequired,
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

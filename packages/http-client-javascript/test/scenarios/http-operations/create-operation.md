# Should generate a basic create http operation

This is a simple get operation with no request payload or parameters and a simple model return.

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

Generates the operation function which prepares the request options. In this case it has not query, path or header parameters. No body either so headers is empty.

The response body is of type Widget so the right transform should be imported to transform the widget from its wire format to the application form.

It should throw an exception if an unexpected status code is received

```ts src/api/operations.ts function foo
export async function foo(
  client: TestContext,
  id: string,
  totalWeight: number,
  color: "red" | "blue",
  options?: {
    isRequired?: boolean;
  },
): Promise<void> {
  const path = parse("/").expand({});

  const url = `${client.endpoint.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  const httpRequestOptions = {
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: id,
      total_weight: totalWeight,
      color: color,
      is_required: options?.isRequired,
    }),
  };

  const response = await httpFetch(url, httpRequestOptions);
  if (response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

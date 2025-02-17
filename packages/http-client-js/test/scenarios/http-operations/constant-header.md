# Should handle when provided a constant header

```tsp
@service
namespace Test;
model Foo {
  name: string;
}

@get op foo(@header accept: "application/xml"): Foo;
```

## Operation

```ts src/api/testClientOperations.ts function foo
export async function foo(client: TestClientContext, options?: FooOptions): Promise<Foo> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {
      accept: options?.accept ?? "application/xml",
    },
  };

  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }

  if (+response.status === 200 && response.headers["content-type"]?.includes("application/json")) {
    return jsonFooToApplicationTransform(response.body)!;
  }

  throw createRestError(response);
}
```

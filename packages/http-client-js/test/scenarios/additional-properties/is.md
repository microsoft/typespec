# Should generate a model with an additional properties defined with model is Record<>

## TypeSpec

Defines a model with Additional Properties modeled as model is Record<>

```tsp
namespace Test;

model Widget is Record<string>;

op foo(): Widget;
```

## Models

Should not create model and treat it as a Record.

## Operation

Should just treat it as a Record

```ts src/api/testClientOperations.ts function foo
export async function foo(
  client: TestClientContext,
  options?: FooOptions,
): Promise<Record<string, string>> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {},
  };
  const response = await client.pathUnchecked(path).get(httpRequestOptions);

  if (typeof options?.operationOptions?.onResponse === "function") {
    options?.operationOptions?.onResponse(response);
  }
  if (
    +response.status === 200 &&
    response.headers["content-type"]?.includes("application/json")
  ) {
    return jsonRecordStringToApplicationTransform(response.body)!;
  }
  throw createRestError(response);
}
```

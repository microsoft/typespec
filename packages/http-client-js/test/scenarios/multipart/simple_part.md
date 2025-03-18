# Simple multipart part

```tsp
namespace Test;

model Foo {
  name: HttpPart<string>;
  age: HttpPart<int32>;
  description?: HttpPart<string>;
}

op doThing(@header contentType: "multipart/form-data", @multipartBody bodyParam: Foo): void;
```

## Models

This basic case uses TypeSpec's `Http.File`, which specifies an optional `filename` and `contentType`.

```ts src/models/models.ts interface Foo
export interface Foo {
  name: string;
  age: number;
  description?: string;
}
```

## Operations

```ts src/api/testClientOperations.ts function doThing
export async function doThing(
  client: TestClientContext,
  bodyParam: Foo,
  options?: DoThingOptions,
): Promise<void> {
  const path = parse("/").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "multipart/form-data",
    },
    body: [
      {
        name: "name",
        body: bodyParam.name,
      },
      {
        name: "age",
        body: bodyParam.age,
      },
      {
        name: "description",
        body: bodyParam.description,
      },
    ],
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

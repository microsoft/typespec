# Should handle an http part with anonymous model

```tsp
@service
namespace Test;

op foo(
  @header contentType: "multipart/form-data",
  @multipartBody body: {
    temperature: HttpPart<{
      @body body: float64;
      @header contentType: "text/plain";
    }>;
  },
): NoContentResponse;
```

## Operation

```ts src/api/testClientOperations.ts function foo
export async function foo(
  client: TestClientContext,
  body: {
    temperature: {
      body: number;
      contentType: "text/plain";
    };
  },
  options?: FooOptions,
): Promise<void> {
  const path = parse("/").expand({});

  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "multipart/form-data",
    },
    body: [
      {
        name: "temperature",
        body: body.temperature,
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

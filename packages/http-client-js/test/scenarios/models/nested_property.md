# Should handle a model that has a property of type ModelProperty

```tsp
@service
namespace Test;
model Request {
  id: string;
  profileImage: bytes;
}

@post
@route("/foo")
op foo(profileImage: Request.profileImage): NoContentResponse;
```

## Operation

```ts src/api/testClientOperations.ts function foo
export async function foo(
  client: TestClientContext,
  profileImage: Uint8Array,
  options?: FooOptions,
): Promise<void> {
  const path = parse("/foo").expand({});

  const httpRequestOptions = {
    headers: {},
    body: {
      profileImage: encodeUint8Array(profileImage, "base64")!,
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

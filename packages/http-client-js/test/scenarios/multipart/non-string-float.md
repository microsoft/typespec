# Tests content-type: multipart/form-data for non string

## Spec

```tsp
namespace Test;
@post
@route("/non-string-float")
op float(
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

```ts src/api/testClientOperations.ts function float
export async function float(
  client: TestClientContext,
  body: { temperature: { body: number; contentType: "text/plain" } },
  options?: FloatOptions,
): Promise<void> {
  const path = parse("/non-string-float").expand({});
  const httpRequestOptions = {
    headers: {
      "content-type": options?.contentType ?? "multipart/form-data",
    },
    body: [
      {
        name: "temperature",
        body: body.temperature.body,
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

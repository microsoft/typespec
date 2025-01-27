# Should handle spread with multiple parameters

## Typespec

```tsp
@service({
  title: "Test Service",
})
namespace Test;
alias MultipleRequestParameters = {
  @path
  id: string;

  @header
  `x-ms-test-header`: string;

  /** required string */
  requiredString: string;

  /** optional int */
  optionalInt?: int32;

  /** required int */
  requiredIntList: int32[];

  /** optional string */
  optionalStringList?: string[];
};

@put
op spreadWithMultipleParameters(...MultipleRequestParameters): NoContentResponse;
```

## Typescript

When spreading a model an anonymous model created in the type graph, the emitted operation should have the serializer expression inline. No serializer function for this operation is expected in src/models/serializers.ts

```ts src/api/testClientOperations.ts function spreadWithMultipleParameters
export async function spreadWithMultipleParameters(
  client: TestClientContext,
  xMsTestHeader: string,
  id: string,
  requiredString: string,
  requiredIntList: Array<number>,
  options?: {
    optionalInt?: number;
    optionalStringList?: Array<string>;
  },
): Promise<void> {
  const path = parse("/{id}").expand({
    id: id,
  });

  const httpRequestOptions = {
    headers: {
      "content-type": "application/json",
      "x-ms-test-header": xMsTestHeader,
    },
    body: {
      requiredString: requiredString,
      optionalInt: options?.optionalInt,
      requiredIntList: arraySerializer(requiredIntList),
      optionalStringList: options?.optionalStringList
        ? arraySerializer(options?.optionalStringList)
        : options?.optionalStringList,
    },
  };

  const response = await client.path(path).put(httpRequestOptions);
  if (+response.status === 204 && !response.body) {
    return;
  }

  throw new Error("Unhandled response");
}
```

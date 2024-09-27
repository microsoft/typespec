import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(url: string, value: unknown, patchNullableProperty?: any) {
  return passOnSuccess({
    uri: url,
    mockMethods: [
      {
        method: `get`,
        request: {},
        response: {
          status: 200,
          body: value,
        },
        handler: (req: MockRequest) => {
          return {
            status: 200,
            body: json(value),
          };
        },
      },
      {
        method: `patch`,
        request: {
          body: {
            requiredProperty: "foo",
            nullableProperty: patchNullableProperty || null,
          },
          headers: {
            "Content-Type": "application/merge-patch+json",
          },
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          req.expect.bodyEquals({
            requiredProperty: "foo",
            nullableProperty: patchNullableProperty || null,
          });
          return {
            status: 204,
          };
        },
      },
    ],
    kind: "MockApiDefinition",
  });
}

Scenarios.Type_Property_Nullable_String_Null = createServerTests(
  `/type/property/nullable/string/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
Scenarios.Type_Property_Nullable_Bytes_Null = createServerTests(
  `/type/property/nullable/bytes/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
Scenarios.Type_Property_Nullable_DateTime_Null = createServerTests(
  `/type/property/nullable/datetime/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
Scenarios.Type_Property_Nullable_Duration_Null = createServerTests(
  `/type/property/nullable/duration/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
Scenarios.Type_Property_Nullable_Collections_Bytes_Null = createServerTests(
  `/type/property/nullable/collections/bytes/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
Scenarios.Type_Property_Nullable_Collections_Model_Null = createServerTests(
  `/type/property/nullable/collections/model/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
Scenarios.Type_Property_Nullable_Collections_String_Null = createServerTests(
  `/type/property/nullable/collections/string/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);

Scenarios.Type_Property_Nullable_String_Non_Null = createServerTests(
  `/type/property/nullable/string/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: "hello",
  },
  "hello",
);
Scenarios.Type_Property_Nullable_Bytes_Non_Null = createServerTests(
  `/type/property/nullable/bytes/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: "aGVsbG8sIHdvcmxkIQ==",
  },
  "aGVsbG8sIHdvcmxkIQ==",
);
Scenarios.Type_Property_Nullable_DateTime_Non_Null = createServerTests(
  `/type/property/nullable/datetime/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: "2022-08-26T18:38:00Z",
  },
  "2022-08-26T18:38:00Z",
);
Scenarios.Type_Property_Nullable_Duration_Non_Null = createServerTests(
  `/type/property/nullable/duration/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: "P123DT22H14M12.011S",
  },
  "P123DT22H14M12.011S",
);
Scenarios.Type_Property_Nullable_Collections_Bytes_Non_Null = createServerTests(
  `/type/property/nullable/collections/bytes/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="],
  },
  ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="],
);
Scenarios.Type_Property_Nullable_Collections_Model_Non_Null = createServerTests(
  `/type/property/nullable/collections/model/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: [{ property: "hello" }, { property: "world" }],
  },
  [{ property: "hello" }, { property: "world" }],
);
Scenarios.Type_Property_Nullable_Collections_String_Non_Null = createServerTests(
  `/type/property/nullable/collections/string/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: ["hello", "world"],
  },
  ["hello", "world"],
);

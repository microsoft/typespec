import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(url: string, value: unknown, patchNullableProperty?: any) {
  return {
    get: passOnSuccess({
      uri: url,
      method: `get`,
      response: {
        status: 200,
        body: json(value),
      },
      kind: "MockApiDefinition",
    }),
    patch: passOnSuccess({
      uri: url,
      method: `patch`,
      request: {
        body: json(
          {
            requiredProperty: "foo",
            nullableProperty: patchNullableProperty || null,
          },
          "application/merge-patch+json",
        ),
      },
      response: {
        status: 204,
      },
      handler: (req) => {
        req.expect.coercedBodyEquals({
          requiredProperty: "foo",
          nullableProperty: patchNullableProperty || null,
        });
        return {
          status: 204,
        };
      },
      kind: "MockApiDefinition",
    }),
  };
}

const Type_Property_Nullable_String_Null = createServerTests(
  `/type/property/nullable/string/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
const Type_Property_Nullable_String_Non_Null = createServerTests(
  `/type/property/nullable/string/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: "hello",
  },
  "hello",
);

Scenarios.Type_Property_Nullable_String_getNonNull = Type_Property_Nullable_String_Non_Null.get;
Scenarios.Type_Property_Nullable_String_getNull = Type_Property_Nullable_String_Null.get;
Scenarios.Type_Property_Nullable_String_patchNonNull = Type_Property_Nullable_String_Non_Null.patch;
Scenarios.Type_Property_Nullable_String_patchNull = Type_Property_Nullable_String_Null.patch;

const Type_Property_Nullable_Bytes_Null = createServerTests(`/type/property/nullable/bytes/null`, {
  requiredProperty: "foo",
  nullableProperty: null,
});
const Type_Property_Nullable_Bytes_Non_Null = createServerTests(
  `/type/property/nullable/bytes/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: "aGVsbG8sIHdvcmxkIQ==",
  },
  "aGVsbG8sIHdvcmxkIQ==",
);
Scenarios.Type_Property_Nullable_Bytes_getNonNull = Type_Property_Nullable_Bytes_Non_Null.get;
Scenarios.Type_Property_Nullable_Bytes_getNull = Type_Property_Nullable_Bytes_Null.get;
Scenarios.Type_Property_Nullable_Bytes_patchNonNull = Type_Property_Nullable_Bytes_Non_Null.patch;
Scenarios.Type_Property_Nullable_Bytes_patchNull = Type_Property_Nullable_Bytes_Null.patch;

const Type_Property_Nullable_DateTime_Null = createServerTests(
  `/type/property/nullable/datetime/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
const Type_Property_Nullable_DateTime_Non_Null = createServerTests(
  `/type/property/nullable/datetime/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: "2022-08-26T18:38:00Z",
  },
  "2022-08-26T18:38:00Z",
);
Scenarios.Type_Property_Nullable_Datetime_getNonNull = Type_Property_Nullable_DateTime_Non_Null.get;
Scenarios.Type_Property_Nullable_Datetime_getNull = Type_Property_Nullable_DateTime_Null.get;
Scenarios.Type_Property_Nullable_Datetime_patchNonNull =
  Type_Property_Nullable_DateTime_Non_Null.patch;
Scenarios.Type_Property_Nullable_Datetime_patchNull = Type_Property_Nullable_DateTime_Null.patch;

const Type_Property_Nullable_Duration_Null = createServerTests(
  `/type/property/nullable/duration/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
const Type_Property_Nullable_Duration_Non_Null = createServerTests(
  `/type/property/nullable/duration/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: "P123DT22H14M12.011S",
  },
  "P123DT22H14M12.011S",
);
Scenarios.Type_Property_Nullable_Duration_getNonNull = Type_Property_Nullable_Duration_Non_Null.get;
Scenarios.Type_Property_Nullable_Duration_getNull = Type_Property_Nullable_Duration_Null.get;
Scenarios.Type_Property_Nullable_Duration_patchNonNull =
  Type_Property_Nullable_Duration_Non_Null.patch;
Scenarios.Type_Property_Nullable_Duration_patchNull = Type_Property_Nullable_Duration_Null.patch;

const Type_Property_Nullable_Collections_Bytes_Null = createServerTests(
  `/type/property/nullable/collections/bytes/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
const Type_Property_Nullable_Collections_Bytes_Non_Null = createServerTests(
  `/type/property/nullable/collections/bytes/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="],
  },
  ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="],
);
Scenarios.Type_Property_Nullable_CollectionsByte_getNonNull =
  Type_Property_Nullable_Collections_Bytes_Non_Null.get;
Scenarios.Type_Property_Nullable_CollectionsByte_getNull =
  Type_Property_Nullable_Collections_Bytes_Null.get;
Scenarios.Type_Property_Nullable_CollectionsByte_patchNonNull =
  Type_Property_Nullable_Collections_Bytes_Non_Null.patch;
Scenarios.Type_Property_Nullable_CollectionsByte_patchNull =
  Type_Property_Nullable_Collections_Bytes_Null.patch;

const Type_Property_Nullable_Collections_Model_Null = createServerTests(
  `/type/property/nullable/collections/model/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
const Type_Property_Nullable_Collections_Model_Non_Null = createServerTests(
  `/type/property/nullable/collections/model/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: [{ property: "hello" }, { property: "world" }],
  },
  [{ property: "hello" }, { property: "world" }],
);
Scenarios.Type_Property_Nullable_CollectionsModel_getNonNull =
  Type_Property_Nullable_Collections_Model_Non_Null.get;
Scenarios.Type_Property_Nullable_CollectionsModel_getNull =
  Type_Property_Nullable_Collections_Model_Null.get;
Scenarios.Type_Property_Nullable_CollectionsModel_patchNonNull =
  Type_Property_Nullable_Collections_Model_Non_Null.patch;
Scenarios.Type_Property_Nullable_CollectionsModel_patchNull =
  Type_Property_Nullable_Collections_Model_Null.patch;

const Type_Property_Nullable_Collections_String_Null = createServerTests(
  `/type/property/nullable/collections/string/null`,
  {
    requiredProperty: "foo",
    nullableProperty: null,
  },
);
const Type_Property_Nullable_Collections_String_Non_Null = createServerTests(
  `/type/property/nullable/collections/string/non-null`,
  {
    requiredProperty: "foo",
    nullableProperty: ["hello", "world"],
  },
  ["hello", "world"],
);
Scenarios.Type_Property_Nullable_CollectionsString_getNonNull =
  Type_Property_Nullable_Collections_String_Non_Null.get;
Scenarios.Type_Property_Nullable_CollectionsString_getNull =
  Type_Property_Nullable_Collections_String_Null.get;
Scenarios.Type_Property_Nullable_CollectionsString_patchNonNull =
  Type_Property_Nullable_Collections_String_Non_Null.patch;
Scenarios.Type_Property_Nullable_CollectionsString_patchNull =
  Type_Property_Nullable_Collections_String_Null.patch;

import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(url: string, value: unknown) {
  return {
    get: passOnSuccess({
      uri: url,
      method: `get`,
      request: {},
      response: {
        status: 200,
        body: json(value),
      },
      kind: "MockApiDefinition",
    }),
    put: passOnSuccess({
      uri: url,
      method: `put`,
      request: {
        body: json(value),
      },
      response: {
        status: 204,
      },
      handler: (req) => {
        req.expect.coercedBodyEquals(value);
        return {
          status: 204,
        };
      },
      kind: "MockApiDefinition",
    }),
  };
}

const Type_Property_Optional_String_Default = createServerTests(
  `/type/property/optional/string/default`,
  {},
);
const Type_Property_Optional_String_All = createServerTests(`/type/property/optional/string/all`, {
  property: "hello",
});
Scenarios.Type_Property_Optional_String_getDefault = Type_Property_Optional_String_Default.get;
Scenarios.Type_Property_Optional_String_putDefault = Type_Property_Optional_String_Default.put;
Scenarios.Type_Property_Optional_String_getAll = Type_Property_Optional_String_All.get;
Scenarios.Type_Property_Optional_String_putAll = Type_Property_Optional_String_All.put;

const Type_Property_Optional_Bytes_Default = createServerTests(
  `/type/property/optional/bytes/default`,
  {},
);
const Type_Property_Optional_Bytes_All = createServerTests(`/type/property/optional/bytes/all`, {
  property: "aGVsbG8sIHdvcmxkIQ==",
});
Scenarios.Type_Property_Optional_Bytes_getDefault = Type_Property_Optional_Bytes_Default.get;
Scenarios.Type_Property_Optional_Bytes_putDefault = Type_Property_Optional_Bytes_Default.put;
Scenarios.Type_Property_Optional_Bytes_getAll = Type_Property_Optional_Bytes_All.get;
Scenarios.Type_Property_Optional_Bytes_putAll = Type_Property_Optional_Bytes_All.put;

const Type_Property_Optional_DateTime_Default = createServerTests(
  `/type/property/optional/datetime/default`,
  {},
);
const Type_Property_Optional_DateTime_All = createServerTests(
  `/type/property/optional/datetime/all`,
  {
    property: "2022-08-26T18:38:00Z",
  },
);
Scenarios.Type_Property_Optional_Datetime_getDefault = Type_Property_Optional_DateTime_Default.get;
Scenarios.Type_Property_Optional_Datetime_putDefault = Type_Property_Optional_DateTime_Default.put;
Scenarios.Type_Property_Optional_Datetime_getAll = Type_Property_Optional_DateTime_All.get;
Scenarios.Type_Property_Optional_Datetime_putAll = Type_Property_Optional_DateTime_All.put;

const Type_Property_Optional_Duration_Default = createServerTests(
  `/type/property/optional/duration/default`,
  {},
);
const Type_Property_Optional_Duration_All = createServerTests(
  `/type/property/optional/duration/all`,
  {
    property: "P123DT22H14M12.011S",
  },
);

Scenarios.Type_Property_Optional_Duration_getDefault = Type_Property_Optional_Duration_Default.get;
Scenarios.Type_Property_Optional_Duration_putDefault = Type_Property_Optional_Duration_Default.put;
Scenarios.Type_Property_Optional_Duration_getAll = Type_Property_Optional_Duration_All.get;
Scenarios.Type_Property_Optional_Duration_putAll = Type_Property_Optional_Duration_All.put;

const Type_Property_Optional_PlainDate_Default = createServerTests(
  `/type/property/optional/plainDate/default`,
  {},
);
const Type_Property_Optional_PlainDate_All = createServerTests(
  `/type/property/optional/plainDate/all`,
  {
    property: "2022-12-12",
  },
);

Scenarios.Type_Property_Optional_PlainDate_getDefault =
  Type_Property_Optional_PlainDate_Default.get;
Scenarios.Type_Property_Optional_PlainDate_putDefault =
  Type_Property_Optional_PlainDate_Default.put;
Scenarios.Type_Property_Optional_PlainDate_getAll = Type_Property_Optional_PlainDate_All.get;
Scenarios.Type_Property_Optional_PlainDate_putAll = Type_Property_Optional_PlainDate_All.put;

const Type_Property_Optional_PlainTime_Default = createServerTests(
  `/type/property/optional/plainTime/default`,
  {},
);
const Type_Property_Optional_PlainTime_All = createServerTests(
  `/type/property/optional/plainTime/all`,
  {
    property: "13:06:12",
  },
);
Scenarios.Type_Property_Optional_PlainTime_getDefault =
  Type_Property_Optional_PlainTime_Default.get;
Scenarios.Type_Property_Optional_PlainTime_putDefault =
  Type_Property_Optional_PlainTime_Default.put;
Scenarios.Type_Property_Optional_PlainTime_getAll = Type_Property_Optional_PlainTime_All.get;
Scenarios.Type_Property_Optional_PlainTime_putAll = Type_Property_Optional_PlainTime_All.put;

const Type_Property_Optional_Collections_Bytes_Default = createServerTests(
  `/type/property/optional/collections/bytes/default`,
  {},
);
const Type_Property_Optional_Collections_Bytes_All = createServerTests(
  `/type/property/optional/collections/bytes/all`,
  { property: ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="] },
);

Scenarios.Type_Property_Optional_CollectionsByte_getDefault =
  Type_Property_Optional_Collections_Bytes_Default.get;
Scenarios.Type_Property_Optional_CollectionsByte_putDefault =
  Type_Property_Optional_Collections_Bytes_Default.put;
Scenarios.Type_Property_Optional_CollectionsByte_getAll =
  Type_Property_Optional_Collections_Bytes_All.get;
Scenarios.Type_Property_Optional_CollectionsByte_putAll =
  Type_Property_Optional_Collections_Bytes_All.put;

const Type_Property_Optional_Collections_Model_Default = createServerTests(
  `/type/property/optional/collections/model/default`,
  {},
);
const Type_Property_Optional_Collections_Model_All = createServerTests(
  `/type/property/optional/collections/model/all`,
  { property: [{ property: "hello" }, { property: "world" }] },
);
Scenarios.Type_Property_Optional_CollectionsModel_getDefault =
  Type_Property_Optional_Collections_Model_Default.get;
Scenarios.Type_Property_Optional_CollectionsModel_putDefault =
  Type_Property_Optional_Collections_Model_Default.put;
Scenarios.Type_Property_Optional_CollectionsModel_getAll =
  Type_Property_Optional_Collections_Model_All.get;
Scenarios.Type_Property_Optional_CollectionsModel_putAll =
  Type_Property_Optional_Collections_Model_All.put;

const Type_Property_Optional_String_Literal_Default = createServerTests(
  `/type/property/optional/string/literal/default`,
  {},
);
const Type_Property_Optional_String_Literal_All = createServerTests(
  `/type/property/optional/string/literal/all`,
  {
    property: "hello",
  },
);
Scenarios.Type_Property_Optional_StringLiteral_getDefault =
  Type_Property_Optional_String_Literal_Default.get;
Scenarios.Type_Property_Optional_StringLiteral_putDefault =
  Type_Property_Optional_String_Literal_Default.put;
Scenarios.Type_Property_Optional_StringLiteral_getAll =
  Type_Property_Optional_String_Literal_All.get;
Scenarios.Type_Property_Optional_StringLiteral_putAll =
  Type_Property_Optional_String_Literal_All.put;

const Type_Property_Optional_Int_Literal_Default = createServerTests(
  `/type/property/optional/int/literal/default`,
  {},
);
const Type_Property_Optional_Int_Literal_All = createServerTests(
  `/type/property/optional/int/literal/all`,
  {
    property: 1,
  },
);
Scenarios.Type_Property_Optional_IntLiteral_getDefault =
  Type_Property_Optional_Int_Literal_Default.get;
Scenarios.Type_Property_Optional_IntLiteral_putDefault =
  Type_Property_Optional_Int_Literal_Default.put;
Scenarios.Type_Property_Optional_IntLiteral_getAll = Type_Property_Optional_Int_Literal_All.get;
Scenarios.Type_Property_Optional_IntLiteral_putAll = Type_Property_Optional_Int_Literal_All.put;

const Type_Property_Optional_Float_Literal_Default = createServerTests(
  `/type/property/optional/float/literal/default`,
  {},
);
const Type_Property_Optional_Float_Literal_All = createServerTests(
  `/type/property/optional/float/literal/all`,
  {
    property: 1.25,
  },
);
Scenarios.Type_Property_Optional_FloatLiteral_getDefault =
  Type_Property_Optional_Float_Literal_Default.get;
Scenarios.Type_Property_Optional_FloatLiteral_putDefault =
  Type_Property_Optional_Float_Literal_Default.put;
Scenarios.Type_Property_Optional_FloatLiteral_getAll = Type_Property_Optional_Float_Literal_All.get;
Scenarios.Type_Property_Optional_FloatLiteral_putAll = Type_Property_Optional_Float_Literal_All.put;

const Type_Property_Optional_Boolean_Literal_Default = createServerTests(
  `/type/property/optional/boolean/literal/default`,
  {},
);
const Type_Property_Optional_Boolean_Literal_All = createServerTests(
  `/type/property/optional/boolean/literal/all`,
  { property: true },
);
Scenarios.Type_Property_Optional_BooleanLiteral_getDefault =
  Type_Property_Optional_Boolean_Literal_Default.get;
Scenarios.Type_Property_Optional_BooleanLiteral_putDefault =
  Type_Property_Optional_Boolean_Literal_Default.put;
Scenarios.Type_Property_Optional_BooleanLiteral_getAll =
  Type_Property_Optional_Boolean_Literal_All.get;
Scenarios.Type_Property_Optional_BooleanLiteral_putAll =
  Type_Property_Optional_Boolean_Literal_All.put;

const Type_Property_Optional_Union_String_Literal_Default = createServerTests(
  `/type/property/optional/union/string/literal/default`,
  {},
);
const Type_Property_Optional_Union_String_Literal_All = createServerTests(
  `/type/property/optional/union/string/literal/all`,
  { property: "world" },
);
Scenarios.Type_Property_Optional_UnionStringLiteral_getDefault =
  Type_Property_Optional_Union_String_Literal_Default.get;
Scenarios.Type_Property_Optional_UnionStringLiteral_putDefault =
  Type_Property_Optional_Union_String_Literal_Default.put;
Scenarios.Type_Property_Optional_UnionStringLiteral_getAll =
  Type_Property_Optional_Union_String_Literal_All.get;
Scenarios.Type_Property_Optional_UnionStringLiteral_putAll =
  Type_Property_Optional_Union_String_Literal_All.put;

const Type_Property_Optional_Union_Int_Literal_Default = createServerTests(
  `/type/property/optional/union/int/literal/default`,
  {},
);
const Type_Property_Optional_Union_Int_Literal_All = createServerTests(
  `/type/property/optional/union/int/literal/all`,
  { property: 2 },
);
Scenarios.Type_Property_Optional_UnionIntLiteral_getDefault =
  Type_Property_Optional_Union_Int_Literal_Default.get;
Scenarios.Type_Property_Optional_UnionIntLiteral_putDefault =
  Type_Property_Optional_Union_Int_Literal_Default.put;
Scenarios.Type_Property_Optional_UnionIntLiteral_getAll =
  Type_Property_Optional_Union_Int_Literal_All.get;
Scenarios.Type_Property_Optional_UnionIntLiteral_putAll =
  Type_Property_Optional_Union_Int_Literal_All.put;

const Type_Property_Optional_Union_Float_Literal_Default = createServerTests(
  `/type/property/optional/union/float/literal/default`,
  {},
);
const Type_Property_Optional_Union_Float_Literal_All = createServerTests(
  `/type/property/optional/union/float/literal/all`,
  { property: 2.375 },
);
Scenarios.Type_Property_Optional_UnionFloatLiteral_getDefault =
  Type_Property_Optional_Union_Float_Literal_Default.get;
Scenarios.Type_Property_Optional_UnionFloatLiteral_putDefault =
  Type_Property_Optional_Union_Float_Literal_Default.put;
Scenarios.Type_Property_Optional_UnionFloatLiteral_getAll =
  Type_Property_Optional_Union_Float_Literal_All.get;
Scenarios.Type_Property_Optional_UnionFloatLiteral_putAll =
  Type_Property_Optional_Union_Float_Literal_All.put;

const Type_Property_Optional_Required_And_Optional_RequiredOnly = createServerTests(
  `/type/property/optional/requiredAndOptional/requiredOnly`,
  { requiredProperty: 42 },
);
Scenarios.Type_Property_Optional_RequiredAndOptional_getRequiredOnly =
  Type_Property_Optional_Required_And_Optional_RequiredOnly.get;
Scenarios.Type_Property_Optional_RequiredAndOptional_putRequiredOnly =
  Type_Property_Optional_Required_And_Optional_RequiredOnly.put;

const Type_Property_Optional_Required_And_Optional_All = createServerTests(
  `/type/property/optional/requiredAndOptional/all`,
  {
    optionalProperty: "hello",
    requiredProperty: 42,
  },
);
Scenarios.Type_Property_Optional_RequiredAndOptional_getAll =
  Type_Property_Optional_Required_And_Optional_All.get;
Scenarios.Type_Property_Optional_RequiredAndOptional_putAll =
  Type_Property_Optional_Required_And_Optional_All.put;

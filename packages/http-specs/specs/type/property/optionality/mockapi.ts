import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(url: string, value: unknown) {
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
        method: `put`,
        request: {
          body: value,
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          req.expect.bodyEquals(value);
          return {
            status: 204,
          };
        },
      },
    ],
    kind: "MockApiDefinition",
  });
}

Scenarios.Type_Property_Optional_String_Default = createServerTests(
  `/type/property/optional/string/default`,
  {},
);
Scenarios.Type_Property_Optional_Bytes_Default = createServerTests(
  `/type/property/optional/bytes/default`,
  {},
);
Scenarios.Type_Property_Optional_DateTime_Default = createServerTests(
  `/type/property/optional/datetime/default`,
  {},
);
Scenarios.Type_Property_Optional_Duration_Default = createServerTests(
  `/type/property/optional/duration/default`,
  {},
);
Scenarios.Type_Property_Optional_PlainDate_Default = createServerTests(
  `/type/property/optional/plainDate/default`,
  {},
);
Scenarios.Type_Property_Optional_PlainTime_Default = createServerTests(
  `/type/property/optional/plainTime/default`,
  {},
);
Scenarios.Type_Property_Optional_Collections_Bytes_Default = createServerTests(
  `/type/property/optional/collections/bytes/default`,
  {},
);
Scenarios.Type_Property_Optional_Collections_Model_Default = createServerTests(
  `/type/property/optional/collections/model/default`,
  {},
);
Scenarios.Type_Property_Optional_String_Literal_Default = createServerTests(
  `/type/property/optional/string/literal/default`,
  {},
);
Scenarios.Type_Property_Optional_Int_Literal_Default = createServerTests(
  `/type/property/optional/int/literal/default`,
  {},
);
Scenarios.Type_Property_Optional_Float_Literal_Default = createServerTests(
  `/type/property/optional/float/literal/default`,
  {},
);
Scenarios.Type_Property_Optional_Boolean_Literal_Default = createServerTests(
  `/type/property/optional/boolean/literal/default`,
  {},
);
Scenarios.Type_Property_Optional_Union_String_Literal_Default = createServerTests(
  `/type/property/optional/union/string/literal/default`,
  {},
);
Scenarios.Type_Property_Optional_Union_Int_Literal_Default = createServerTests(
  `/type/property/optional/union/int/literal/default`,
  {},
);
Scenarios.Type_Property_Optional_Union_Float_Literal_Default = createServerTests(
  `/type/property/optional/union/float/literal/default`,
  {},
);
Scenarios.Type_Property_Optional_Required_And_Optional_RequiredOnly = createServerTests(
  `/type/property/optional/requiredAndOptional/requiredOnly`,
  { requiredProperty: 42 },
);

Scenarios.Type_Property_Optional_String_All = createServerTests(
  `/type/property/optional/string/all`,
  {
    property: "hello",
  },
);
Scenarios.Type_Property_Optional_Bytes_All = createServerTests(
  `/type/property/optional/bytes/all`,
  {
    property: "aGVsbG8sIHdvcmxkIQ==",
  },
);
Scenarios.Type_Property_Optional_DateTime_All = createServerTests(
  `/type/property/optional/datetime/all`,
  {
    property: "2022-08-26T18:38:00Z",
  },
);
Scenarios.Type_Property_Optional_Duration_All = createServerTests(
  `/type/property/optional/duration/all`,
  {
    property: "P123DT22H14M12.011S",
  },
);
Scenarios.Type_Property_Optional_PlainDate_All = createServerTests(
  `/type/property/optional/plainDate/all`,
  {
    property: "2022-12-12",
  },
);
Scenarios.Type_Property_Optional_PlainTime_All = createServerTests(
  `/type/property/optional/plainTime/all`,
  {
    property: "13:06:12",
  },
);
Scenarios.Type_Property_Optional_Collections_Bytes_All = createServerTests(
  `/type/property/optional/collections/bytes/all`,
  { property: ["aGVsbG8sIHdvcmxkIQ==", "aGVsbG8sIHdvcmxkIQ=="] },
);
Scenarios.Type_Property_Optional_Collections_Model_All = createServerTests(
  `/type/property/optional/collections/model/all`,
  { property: [{ property: "hello" }, { property: "world" }] },
);
Scenarios.Type_Property_Optional_String_Literal_All = createServerTests(
  `/type/property/optional/string/literal/all`,
  {
    property: "hello",
  },
);
Scenarios.Type_Property_Optional_Int_Literal_All = createServerTests(
  `/type/property/optional/int/literal/all`,
  {
    property: 1,
  },
);
Scenarios.Type_Property_Optional_Float_Literal_All = createServerTests(
  `/type/property/optional/float/literal/all`,
  {
    property: 1.25,
  },
);
Scenarios.Type_Property_Optional_Boolean_Literal_All = createServerTests(
  `/type/property/optional/boolean/literal/all`,
  { property: true },
);
Scenarios.Type_Property_Optional_Union_String_Literal_All = createServerTests(
  `/type/property/optional/union/string/literal/all`,
  { property: "world" },
);
Scenarios.Type_Property_Optional_Union_Int_Literal_All = createServerTests(
  `/type/property/optional/union/int/literal/all`,
  { property: 2 },
);
Scenarios.Type_Property_Optional_Union_Float_Literal_All = createServerTests(
  `/type/property/optional/union/float/literal/all`,
  { property: 2.375 },
);
Scenarios.Type_Property_Optional_Required_And_Optional_All = createServerTests(
  `/type/property/optional/requiredAndOptional/all`,
  {
    optionalProperty: "hello",
    requiredProperty: 42,
  },
);

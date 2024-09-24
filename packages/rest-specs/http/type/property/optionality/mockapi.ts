import { json, mockapi, MockApi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

interface MockApiGetPut {
  getAll: MockApi;
  getDefault: MockApi;
  putAll: MockApi;
  putDefault: MockApi;
}

/**
 * Return the get and put operations
 * @param route The route within /models/properties/optional/all/ for your function.
 * @param value The value you are expecting and will return
 */
function createMockApis(route: string, value: any): MockApiGetPut {
  const url = `/type/property/optional/${route}`;
  const allUrl = `${url}/all`;
  const defaultUrl = `${url}/default`;
  const allBody = { property: value };
  const defaultBody = {};
  const getAll = mockapi.get(allUrl, (req) => {
    return {
      status: 200,
      body: json(allBody),
    };
  });
  const getDefault = mockapi.get(defaultUrl, (req) => {
    return {
      status: 200,
      body: json(defaultBody),
    };
  });
  const putAll = mockapi.put(allUrl, (req) => {
    const expectedBody = JSON.parse(JSON.stringify(allBody)); // deep clone
    req.expect.coercedBodyEquals(expectedBody);
    return {
      status: 204,
    };
  });
  const putDefault = mockapi.put(defaultUrl, (req) => {
    req.expect.bodyEquals(defaultBody);
    return {
      status: 204,
    };
  });
  return {
    getAll: getAll,
    getDefault: getDefault,
    putAll: putAll,
    putDefault: putDefault,
  };
}

const stringMock = createMockApis("string", "hello");
Scenarios.Type_Property_Optional_String_getAll = passOnSuccess(stringMock.getAll);
Scenarios.Type_Property_Optional_String_getDefault = passOnSuccess(stringMock.getDefault);
Scenarios.Type_Property_Optional_String_putAll = passOnSuccess(stringMock.putAll);
Scenarios.Type_Property_Optional_String_putDefault = passOnSuccess(stringMock.putDefault);

const bytesMock = createMockApis("bytes", "aGVsbG8sIHdvcmxkIQ==");
Scenarios.Type_Property_Optional_Bytes_getAll = passOnSuccess(bytesMock.getAll);
Scenarios.Type_Property_Optional_Bytes_getDefault = passOnSuccess(bytesMock.getDefault);
Scenarios.Type_Property_Optional_Bytes_putAll = passOnSuccess(bytesMock.putAll);
Scenarios.Type_Property_Optional_Bytes_putDefault = passOnSuccess(bytesMock.putDefault);

const datetimeMock = createMockApis("datetime", "2022-08-26T18:38:00Z");
Scenarios.Type_Property_Optional_Datetime_getAll = passOnSuccess(datetimeMock.getAll);
Scenarios.Type_Property_Optional_Datetime_getDefault = passOnSuccess(datetimeMock.getDefault);
Scenarios.Type_Property_Optional_Datetime_putAll = passOnSuccess(datetimeMock.putAll);
Scenarios.Type_Property_Optional_Datetime_putDefault = passOnSuccess(datetimeMock.putDefault);

const durationMock = createMockApis("duration", "P123DT22H14M12.011S");
Scenarios.Type_Property_Optional_Duration_getAll = passOnSuccess(durationMock.getAll);
Scenarios.Type_Property_Optional_Duration_getDefault = passOnSuccess(durationMock.getDefault);
Scenarios.Type_Property_Optional_Duration_putAll = passOnSuccess(durationMock.putAll);
Scenarios.Type_Property_Optional_Duration_putDefault = passOnSuccess(durationMock.putDefault);

const plainDateMock = createMockApis("plainDate", "2022-12-12");
Scenarios.Type_Property_Optional_PlainDate_getAll = passOnSuccess(plainDateMock.getAll);
Scenarios.Type_Property_Optional_PlainDate_getDefault = passOnSuccess(plainDateMock.getDefault);
Scenarios.Type_Property_Optional_PlainDate_putAll = passOnSuccess(plainDateMock.putAll);
Scenarios.Type_Property_Optional_PlainDate_putDefault = passOnSuccess(plainDateMock.putDefault);

const plainTimeMock = createMockApis("plainTime", "13:06:12");
Scenarios.Type_Property_Optional_PlainTime_getAll = passOnSuccess(plainTimeMock.getAll);
Scenarios.Type_Property_Optional_PlainTime_getDefault = passOnSuccess(plainTimeMock.getDefault);
Scenarios.Type_Property_Optional_PlainTime_putAll = passOnSuccess(plainTimeMock.putAll);
Scenarios.Type_Property_Optional_PlainTime_putDefault = passOnSuccess(plainTimeMock.putDefault);

const collectionsBytesMock = createMockApis("collections/bytes", [
  "aGVsbG8sIHdvcmxkIQ==",
  "aGVsbG8sIHdvcmxkIQ==",
]);
Scenarios.Type_Property_Optional_CollectionsByte_getAll = passOnSuccess(
  collectionsBytesMock.getAll,
);
Scenarios.Type_Property_Optional_CollectionsByte_getDefault = passOnSuccess(
  collectionsBytesMock.getDefault,
);
Scenarios.Type_Property_Optional_CollectionsByte_putAll = passOnSuccess(
  collectionsBytesMock.putAll,
);
Scenarios.Type_Property_Optional_CollectionsByte_putDefault = passOnSuccess(
  collectionsBytesMock.putDefault,
);

const collectionsModelMock = createMockApis("collections/model", [
  { property: "hello" },
  { property: "world" },
]);
Scenarios.Type_Property_Optional_CollectionsModel_getAll = passOnSuccess(
  collectionsModelMock.getAll,
);
Scenarios.Type_Property_Optional_CollectionsModel_getDefault = passOnSuccess(
  collectionsModelMock.getDefault,
);
Scenarios.Type_Property_Optional_CollectionsModel_putAll = passOnSuccess(
  collectionsModelMock.putAll,
);
Scenarios.Type_Property_Optional_CollectionsModel_putDefault = passOnSuccess(
  collectionsModelMock.putDefault,
);

const stringLiteralMock = createMockApis("string/literal", "hello");
Scenarios.Type_Property_Optional_StringLiteral_getAll = passOnSuccess(stringLiteralMock.getAll);
Scenarios.Type_Property_Optional_StringLiteral_getDefault = passOnSuccess(
  stringLiteralMock.getDefault,
);
Scenarios.Type_Property_Optional_StringLiteral_putAll = passOnSuccess(stringLiteralMock.putAll);
Scenarios.Type_Property_Optional_StringLiteral_putDefault = passOnSuccess(
  stringLiteralMock.putDefault,
);

const intLiteralMock = createMockApis("int/literal", 1);
Scenarios.Type_Property_Optional_IntLiteral_getAll = passOnSuccess(intLiteralMock.getAll);
Scenarios.Type_Property_Optional_IntLiteral_getDefault = passOnSuccess(intLiteralMock.getDefault);
Scenarios.Type_Property_Optional_IntLiteral_putAll = passOnSuccess(intLiteralMock.putAll);
Scenarios.Type_Property_Optional_IntLiteral_putDefault = passOnSuccess(intLiteralMock.putDefault);

const floatLiteralMock = createMockApis("float/literal", 1.25);
Scenarios.Type_Property_Optional_FloatLiteral_getAll = passOnSuccess(floatLiteralMock.getAll);
Scenarios.Type_Property_Optional_FloatLiteral_getDefault = passOnSuccess(
  floatLiteralMock.getDefault,
);
Scenarios.Type_Property_Optional_FloatLiteral_putAll = passOnSuccess(floatLiteralMock.putAll);
Scenarios.Type_Property_Optional_FloatLiteral_putDefault = passOnSuccess(
  floatLiteralMock.putDefault,
);

const booleanLiteralMock = createMockApis("boolean/literal", true);
Scenarios.Type_Property_Optional_BooleanLiteral_getAll = passOnSuccess(booleanLiteralMock.getAll);
Scenarios.Type_Property_Optional_BooleanLiteral_getDefault = passOnSuccess(
  booleanLiteralMock.getDefault,
);
Scenarios.Type_Property_Optional_BooleanLiteral_putAll = passOnSuccess(booleanLiteralMock.putAll);
Scenarios.Type_Property_Optional_BooleanLiteral_putDefault = passOnSuccess(
  booleanLiteralMock.putDefault,
);

const unionStringLiteralMock = createMockApis("union/string/literal", "world");
Scenarios.Type_Property_Optional_UnionStringLiteral_getAll = passOnSuccess(
  unionStringLiteralMock.getAll,
);
Scenarios.Type_Property_Optional_UnionStringLiteral_getDefault = passOnSuccess(
  unionStringLiteralMock.getDefault,
);
Scenarios.Type_Property_Optional_UnionStringLiteral_putAll = passOnSuccess(
  unionStringLiteralMock.putAll,
);
Scenarios.Type_Property_Optional_UnionStringLiteral_putDefault = passOnSuccess(
  unionStringLiteralMock.putDefault,
);

const unionIntLiteralMock = createMockApis("union/int/literal", 2);
Scenarios.Type_Property_Optional_UnionIntLiteral_getAll = passOnSuccess(unionIntLiteralMock.getAll);
Scenarios.Type_Property_Optional_UnionIntLiteral_getDefault = passOnSuccess(
  unionIntLiteralMock.getDefault,
);
Scenarios.Type_Property_Optional_UnionIntLiteral_putAll = passOnSuccess(unionIntLiteralMock.putAll);
Scenarios.Type_Property_Optional_UnionIntLiteral_putDefault = passOnSuccess(
  unionIntLiteralMock.putDefault,
);

const unionFloatLiteralMock = createMockApis("union/float/literal", 2.375);
Scenarios.Type_Property_Optional_UnionFloatLiteral_getAll = passOnSuccess(
  unionFloatLiteralMock.getAll,
);
Scenarios.Type_Property_Optional_UnionFloatLiteral_getDefault = passOnSuccess(
  unionFloatLiteralMock.getDefault,
);
Scenarios.Type_Property_Optional_UnionFloatLiteral_putAll = passOnSuccess(
  unionFloatLiteralMock.putAll,
);
Scenarios.Type_Property_Optional_UnionFloatLiteral_putDefault = passOnSuccess(
  unionFloatLiteralMock.putDefault,
);

// TEST REQUIRED AND OPTIONAL PROPERTIES

const requiredAndOptionalBaseUrl = `/type/property/optional/requiredAndOptional`;
Scenarios.Type_Property_Optional_RequiredAndOptional_getAll = passOnSuccess(
  mockapi.get(`${requiredAndOptionalBaseUrl}/all`, (req) => {
    return {
      status: 200,
      body: json({
        optionalProperty: "hello",
        requiredProperty: 42,
      }),
    };
  }),
);
Scenarios.Type_Property_Optional_RequiredAndOptional_getRequiredOnly = passOnSuccess(
  mockapi.get(`${requiredAndOptionalBaseUrl}/requiredOnly`, (req) => {
    return {
      status: 200,
      body: json({
        requiredProperty: 42,
      }),
    };
  }),
);
Scenarios.Type_Property_Optional_RequiredAndOptional_putAll = passOnSuccess(
  mockapi.put(`${requiredAndOptionalBaseUrl}/all`, (req) => {
    req.expect.bodyEquals({
      optionalProperty: "hello",
      requiredProperty: 42,
    });
    return {
      status: 204,
    };
  }),
);
Scenarios.Type_Property_Optional_RequiredAndOptional_putRequiredOnly = passOnSuccess(
  mockapi.put(`${requiredAndOptionalBaseUrl}/requiredOnly`, (req) => {
    req.expect.bodyEquals({
      requiredProperty: 42,
    });
    return {
      status: 204,
    };
  }),
);

function createServerTests(url: string, value: unknown) {
  return passOnSuccess({
    uri: url,
    mockMethods: [
      {
        method: `get`,
        request: {},
        response: {
          status: 200,
          data: value,
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
      },
    ],
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

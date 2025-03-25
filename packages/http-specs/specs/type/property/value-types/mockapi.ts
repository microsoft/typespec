import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(url: string, data: unknown) {
  return {
    get: passOnSuccess({
      uri: url,
      method: `get`,
      request: {},
      response: {
        status: 200,
        body: json(data),
      },
      kind: "MockApiDefinition",
    }),
    put: passOnSuccess({
      uri: url,
      method: `put`,
      request: {
        body: json(data),
      },
      response: {
        status: 204,
      },
      handler: (req) => {
        req.expect.coercedBodyEquals(data);
        return {
          status: 204,
        };
      },
      kind: "MockApiDefinition",
    }),
  };
}

const Type_Property_ValueTypes_Boolean = createServerTests(`/type/property/value-types/boolean`, {
  property: true,
});
Scenarios.Type_Property_ValueTypes_Boolean_get = Type_Property_ValueTypes_Boolean.get;
Scenarios.Type_Property_ValueTypes_Boolean_put = Type_Property_ValueTypes_Boolean.put;

const Type_Property_ValueTypes_String = createServerTests(`/type/property/value-types/string`, {
  property: "hello",
});
Scenarios.Type_Property_ValueTypes_String_get = Type_Property_ValueTypes_String.get;
Scenarios.Type_Property_ValueTypes_String_put = Type_Property_ValueTypes_String.put;

const Type_Property_ValueTypes_Bytes = createServerTests(`/type/property/value-types/bytes`, {
  property: "aGVsbG8sIHdvcmxkIQ==",
});
Scenarios.Type_Property_ValueTypes_Bytes_get = Type_Property_ValueTypes_Bytes.get;
Scenarios.Type_Property_ValueTypes_Bytes_put = Type_Property_ValueTypes_Bytes.put;

const Type_Property_ValueTypes_Int = createServerTests(`/type/property/value-types/int`, {
  property: 42,
});
Scenarios.Type_Property_ValueTypes_Int_get = Type_Property_ValueTypes_Int.get;
Scenarios.Type_Property_ValueTypes_Int_put = Type_Property_ValueTypes_Int.put;

const Type_Property_ValueTypes_Float = createServerTests(`/type/property/value-types/float`, {
  property: 43.125,
});
Scenarios.Type_Property_ValueTypes_Float_get = Type_Property_ValueTypes_Float.get;
Scenarios.Type_Property_ValueTypes_Float_put = Type_Property_ValueTypes_Float.put;

const Type_Property_ValueTypes_Decimal = createServerTests(`/type/property/value-types/decimal`, {
  property: 0.33333,
});
Scenarios.Type_Property_ValueTypes_Decimal_get = Type_Property_ValueTypes_Decimal.get;
Scenarios.Type_Property_ValueTypes_Decimal_put = Type_Property_ValueTypes_Decimal.put;

const Type_Property_ValueTypes_Decimal128 = createServerTests(
  `/type/property/value-types/decimal128`,
  {
    property: 0.33333,
  },
);
Scenarios.Type_Property_ValueTypes_Decimal128_get = Type_Property_ValueTypes_Decimal128.get;
Scenarios.Type_Property_ValueTypes_Decimal128_put = Type_Property_ValueTypes_Decimal128.put;

const Type_Property_ValueTypes_DateTime = createServerTests(`/type/property/value-types/datetime`, {
  property: "2022-08-26T18:38:00Z",
});
Scenarios.Type_Property_ValueTypes_Datetime_get = Type_Property_ValueTypes_DateTime.get;
Scenarios.Type_Property_ValueTypes_Datetime_put = Type_Property_ValueTypes_DateTime.put;

const Type_Property_ValueTypes_Duration = createServerTests(`/type/property/value-types/duration`, {
  property: "P123DT22H14M12.011S",
});
Scenarios.Type_Property_ValueTypes_Duration_get = Type_Property_ValueTypes_Duration.get;
Scenarios.Type_Property_ValueTypes_Duration_put = Type_Property_ValueTypes_Duration.put;

const Type_Property_ValueTypes_Enum = createServerTests(`/type/property/value-types/enum`, {
  property: "ValueOne",
});
Scenarios.Type_Property_ValueTypes_Enum_get = Type_Property_ValueTypes_Enum.get;
Scenarios.Type_Property_ValueTypes_Enum_put = Type_Property_ValueTypes_Enum.put;

const Type_Property_ValueTypes_Extensible_Enum = createServerTests(
  `/type/property/value-types/extensible-enum`,
  {
    property: "UnknownValue",
  },
);
Scenarios.Type_Property_ValueTypes_ExtensibleEnum_get =
  Type_Property_ValueTypes_Extensible_Enum.get;
Scenarios.Type_Property_ValueTypes_ExtensibleEnum_put =
  Type_Property_ValueTypes_Extensible_Enum.put;

const Type_Property_ValueTypes_Model = createServerTests(`/type/property/value-types/model`, {
  property: { property: "hello" },
});
Scenarios.Type_Property_ValueTypes_Model_get = Type_Property_ValueTypes_Model.get;
Scenarios.Type_Property_ValueTypes_Model_put = Type_Property_ValueTypes_Model.put;

const Type_Property_ValueTypes_Collections_String = createServerTests(
  `/type/property/value-types/collections/string`,
  {
    property: ["hello", "world"],
  },
);
Scenarios.Type_Property_ValueTypes_CollectionsString_get =
  Type_Property_ValueTypes_Collections_String.get;
Scenarios.Type_Property_ValueTypes_CollectionsString_put =
  Type_Property_ValueTypes_Collections_String.put;

const Type_Property_ValueTypes_Collections_Int = createServerTests(
  `/type/property/value-types/collections/int`,
  {
    property: [1, 2],
  },
);
Scenarios.Type_Property_ValueTypes_CollectionsInt_get =
  Type_Property_ValueTypes_Collections_Int.get;
Scenarios.Type_Property_ValueTypes_CollectionsInt_put =
  Type_Property_ValueTypes_Collections_Int.put;

const Type_Property_ValueTypes_Collections_Model = createServerTests(
  `/type/property/value-types/collections/model`,
  {
    property: [{ property: "hello" }, { property: "world" }],
  },
);
Scenarios.Type_Property_ValueTypes_CollectionsModel_get =
  Type_Property_ValueTypes_Collections_Model.get;
Scenarios.Type_Property_ValueTypes_CollectionsModel_put =
  Type_Property_ValueTypes_Collections_Model.put;

const Type_Property_ValueTypes_Dictionary_String = createServerTests(
  `/type/property/value-types/dictionary/string`,
  {
    property: { k1: "hello", k2: "world" },
  },
);
Scenarios.Type_Property_ValueTypes_DictionaryString_get =
  Type_Property_ValueTypes_Dictionary_String.get;
Scenarios.Type_Property_ValueTypes_DictionaryString_put =
  Type_Property_ValueTypes_Dictionary_String.put;

const Type_Property_ValueTypes_Never = createServerTests(`/type/property/value-types/never`, {
  property: undefined,
});
Scenarios.Type_Property_ValueTypes_Never_get = Type_Property_ValueTypes_Never.get;
Scenarios.Type_Property_ValueTypes_Never_put = passOnSuccess({
  uri: `/type/property/value-types/never`,
  method: `put`,
  request: {
    body: json({
      property: undefined,
    }),
  },
  response: {
    status: 204,
  },
  handler: (req: MockRequest) => {
    const expectedBody = JSON.parse(
      JSON.stringify({
        property: undefined,
      }),
    );
    req.expect.coercedBodyEquals(expectedBody);
    return {
      status: 204,
    };
  },
  kind: "MockApiDefinition",
});

const Type_Property_ValueTypes_Unknown_String = createServerTests(
  `/type/property/value-types/unknown/string`,
  {
    property: "hello",
  },
);
Scenarios.Type_Property_ValueTypes_UnknownString_get = Type_Property_ValueTypes_Unknown_String.get;
Scenarios.Type_Property_ValueTypes_UnknownString_put = Type_Property_ValueTypes_Unknown_String.put;

const Type_Property_ValueTypes_Unknown_Int = createServerTests(
  `/type/property/value-types/unknown/int`,
  {
    property: 42,
  },
);
Scenarios.Type_Property_ValueTypes_UnknownInt_get = Type_Property_ValueTypes_Unknown_Int.get;
Scenarios.Type_Property_ValueTypes_UnknownInt_put = Type_Property_ValueTypes_Unknown_Int.put;

const Type_Property_ValueTypes_Unknown_Dict = createServerTests(
  `/type/property/value-types/unknown/dict`,
  {
    property: { k1: "hello", k2: 42 },
  },
);
Scenarios.Type_Property_ValueTypes_UnknownDict_get = Type_Property_ValueTypes_Unknown_Dict.get;
Scenarios.Type_Property_ValueTypes_UnknownDict_put = Type_Property_ValueTypes_Unknown_Dict.put;

const Type_Property_ValueTypes_Unknown_Array = createServerTests(
  `/type/property/value-types/unknown/array`,
  {
    property: ["hello", "world"],
  },
);
Scenarios.Type_Property_ValueTypes_UnknownArray_get = Type_Property_ValueTypes_Unknown_Array.get;
Scenarios.Type_Property_ValueTypes_UnknownArray_put = Type_Property_ValueTypes_Unknown_Array.put;

const Type_Property_ValueTypes_String_Literal = createServerTests(
  `/type/property/value-types/string/literal`,
  {
    property: "hello",
  },
);
Scenarios.Type_Property_ValueTypes_StringLiteral_get = Type_Property_ValueTypes_String_Literal.get;
Scenarios.Type_Property_ValueTypes_StringLiteral_put = Type_Property_ValueTypes_String_Literal.put;

const Type_Property_ValueTypes_Int_Literal = createServerTests(
  `/type/property/value-types/int/literal`,
  {
    property: 42,
  },
);
Scenarios.Type_Property_ValueTypes_IntLiteral_get = Type_Property_ValueTypes_Int_Literal.get;
Scenarios.Type_Property_ValueTypes_IntLiteral_put = Type_Property_ValueTypes_Int_Literal.put;

const Type_Property_ValueTypes_Float_Literal = createServerTests(
  `/type/property/value-types/float/literal`,
  {
    property: 43.125,
  },
);
Scenarios.Type_Property_ValueTypes_FloatLiteral_get = Type_Property_ValueTypes_Float_Literal.get;
Scenarios.Type_Property_ValueTypes_FloatLiteral_put = Type_Property_ValueTypes_Float_Literal.put;

const Type_Property_ValueTypes_Boolean_Literal = createServerTests(
  `/type/property/value-types/boolean/literal`,
  {
    property: true,
  },
);
Scenarios.Type_Property_ValueTypes_BooleanLiteral_get =
  Type_Property_ValueTypes_Boolean_Literal.get;
Scenarios.Type_Property_ValueTypes_BooleanLiteral_put =
  Type_Property_ValueTypes_Boolean_Literal.put;

const Type_Property_ValueTypes_Union_String_Literal = createServerTests(
  `/type/property/value-types/union/string/literal`,
  {
    property: "world",
  },
);
Scenarios.Type_Property_ValueTypes_UnionStringLiteral_get =
  Type_Property_ValueTypes_Union_String_Literal.get;
Scenarios.Type_Property_ValueTypes_UnionStringLiteral_put =
  Type_Property_ValueTypes_Union_String_Literal.put;

const Type_Property_ValueTypes_Union_Int_Literal = createServerTests(
  `/type/property/value-types/union/int/literal`,
  {
    property: 42,
  },
);
Scenarios.Type_Property_ValueTypes_UnionIntLiteral_get =
  Type_Property_ValueTypes_Union_Int_Literal.get;
Scenarios.Type_Property_ValueTypes_UnionIntLiteral_put =
  Type_Property_ValueTypes_Union_Int_Literal.put;

const Type_Property_ValueTypes_Union_Float_Literal = createServerTests(
  `/type/property/value-types/union/float/literal`,
  {
    property: 46.875,
  },
);
Scenarios.Type_Property_ValueTypes_UnionFloatLiteral_get =
  Type_Property_ValueTypes_Union_Float_Literal.get;
Scenarios.Type_Property_ValueTypes_UnionFloatLiteral_put =
  Type_Property_ValueTypes_Union_Float_Literal.put;

const Type_Property_ValueTypes_Union_Enum_Value = createServerTests(
  `/type/property/value-types/union-enum-value`,
  {
    property: "value2",
  },
);
Scenarios.Type_Property_ValueTypes_UnionEnumValue_get =
  Type_Property_ValueTypes_Union_Enum_Value.get;
Scenarios.Type_Property_ValueTypes_UnionEnumValue_put =
  Type_Property_ValueTypes_Union_Enum_Value.put;

import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(url: string, data: unknown, convertedToFn?: (_: any) => any) {
  let property;
  if (convertedToFn) {
    property = convertedToFn(data);
  } else {
    property = data;
  }

  return passOnSuccess({
    uri: url,
    mockMethods: [
      {
        method: `get`,
        request: {},
        response: {
          status: 200,
          data: data,
        },
        handler: (req: MockRequest) => {
          return {
            status: 200,
            body: json(data),
          };
        },
      },
      {
        method: `put`,
        request: {
          body: property,
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          const expectedBody = JSON.parse(JSON.stringify(property));
          req.expect.coercedBodyEquals(expectedBody);
          return {
            status: 204,
          };
        },
      },
    ],
  });
}

Scenarios.Type_Property_ValueTypes_Boolean = createServerTests(
  `/type/property/value-types/boolean`,
  {
    property: true,
  },
);
Scenarios.Type_Property_ValueTypes_String = createServerTests(`/type/property/value-types/string`, {
  property: "hello",
});
Scenarios.Type_Property_ValueTypes_Bytes = createServerTests(`/type/property/value-types/bytes`, {
  property: "aGVsbG8sIHdvcmxkIQ==",
});
Scenarios.Type_Property_ValueTypes_Int = createServerTests(`/type/property/value-types/int`, {
  property: 42,
});
Scenarios.Type_Property_ValueTypes_Float = createServerTests(`/type/property/value-types/float`, {
  property: 43.125,
});
Scenarios.Type_Property_ValueTypes_Decimal = createServerTests(
  `/type/property/value-types/decimal`,
  {
    property: 0.33333,
  },
);
Scenarios.Type_Property_ValueTypes_Decimal128 = createServerTests(
  `/type/property/value-types/decimal128`,
  {
    property: 0.33333,
  },
);
Scenarios.Type_Property_ValueTypes_DateTime = createServerTests(
  `/type/property/value-types/datetime`,
  {
    property: "2022-08-26T18:38:00Z",
  },
);
Scenarios.Type_Property_ValueTypes_Duration = createServerTests(
  `/type/property/value-types/duration`,
  {
    property: "P123DT22H14M12.011S",
  },
);
Scenarios.Type_Property_ValueTypes_Enum = createServerTests(`/type/property/value-types/enum`, {
  property: "ValueOne",
});
Scenarios.Type_Property_ValueTypes_Extensible_Enum = createServerTests(
  `/type/property/value-types/extensible-enum`,
  {
    property: "UnknownValue",
  },
);
Scenarios.Type_Property_ValueTypes_Model = createServerTests(`/type/property/value-types/model`, {
  property: { property: "hello" },
});
Scenarios.Type_Property_ValueTypes_Collections_String = createServerTests(
  `/type/property/value-types/collections/string`,
  {
    property: ["hello", "world"],
  },
);
Scenarios.Type_Property_ValueTypes_Collections_Int = createServerTests(
  `/type/property/value-types/collections/int`,
  {
    property: [1, 2],
  },
);
Scenarios.Type_Property_ValueTypes_Collections_Model = createServerTests(
  `/type/property/value-types/collections/model`,
  {
    property: [{ property: "hello" }, { property: "world" }],
  },
);
Scenarios.Type_Property_ValueTypes_Dictionary_String = createServerTests(
  `/type/property/value-types/dictionary/string`,
  {
    property: { k1: "hello", k2: "world" },
  },
);
Scenarios.Type_Property_ValueTypes_Never = createServerTests(`/type/property/value-types/never`, {
  property: undefined,
});
Scenarios.Type_Property_ValueTypes_Unknown_String = createServerTests(
  `/type/property/value-types/unknown/string`,
  {
    property: "hello",
  },
);
Scenarios.Type_Property_ValueTypes_Unknown_Int = createServerTests(
  `/type/property/value-types/unknown/int`,
  {
    property: 42,
  },
);
Scenarios.Type_Property_ValueTypes_Unknown_Dict = createServerTests(
  `/type/property/value-types/unknown/dict`,
  {
    property: { k1: "hello", k2: 42 },
  },
);
Scenarios.Type_Property_ValueTypes_Unknown_Array = createServerTests(
  `/type/property/value-types/unknown/array`,
  {
    property: ["hello", "world"],
  },
);
Scenarios.Type_Property_ValueTypes_String_Literal = createServerTests(
  `/type/property/value-types/string/literal`,
  {
    property: "hello",
  },
);
Scenarios.Type_Property_ValueTypes_Int_Literal = createServerTests(
  `/type/property/value-types/int/literal`,
  {
    property: 42,
  },
);
Scenarios.Type_Property_ValueTypes_Float_Literal = createServerTests(
  `/type/property/value-types/float/literal`,
  {
    property: 43.125,
  },
);
Scenarios.Type_Property_ValueTypes_Boolean_Literal = createServerTests(
  `/type/property/value-types/boolean/literal`,
  {
    property: true,
  },
);
Scenarios.Type_Property_ValueTypes_Union_String_Literal = createServerTests(
  `/type/property/value-types/union/string/literal`,
  {
    property: "world",
  },
);
Scenarios.Type_Property_ValueTypes_Union_Int_Literal = createServerTests(
  `/type/property/value-types/union/int/literal`,
  {
    property: 42,
  },
);
Scenarios.Type_Property_ValueTypes_Union_Float_Literal = createServerTests(
  `/type/property/value-types/union/float/literal`,
  {
    property: 46.875,
  },
);
Scenarios.Type_Property_ValueTypes_Union_Enum_Value = createServerTests(
  `/type/property/value-types/union-enum-value`,
  {
    property: "value2",
  },
);

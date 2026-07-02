import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createMockServerTests(uri: string, data: any) {
  return {
    get: passOnSuccess({
      uri,
      method: "get",
      request: {},
      response: {
        status: 200,
        body: json(data),
      },
      kind: "MockApiDefinition",
    }),
    put: passOnSuccess({
      uri,
      method: "put",
      request: {
        body: json(data),
        headers: {
          "Content-Type": "text/plain",
        },
      },
      response: {
        status: 204,
      },
      kind: "MockApiDefinition",
    }),
  };
}

const Type_Enum_Extensible_String_Known_Value = createMockServerTests(
  `/type/enum/extensible/string/known-value`,
  "Monday",
);
Scenarios.Type_Enum_Extensible_String_getKnownValue = Type_Enum_Extensible_String_Known_Value.get;
Scenarios.Type_Enum_Extensible_String_putKnownValue = Type_Enum_Extensible_String_Known_Value.put;

const Type_Enum_Extensible_String_UnKnown_Value = createMockServerTests(
  `/type/enum/extensible/string/unknown-value`,
  "Weekend",
);
Scenarios.Type_Enum_Extensible_String_getUnknownValue =
  Type_Enum_Extensible_String_UnKnown_Value.get;
Scenarios.Type_Enum_Extensible_String_putUnknownValue =
  Type_Enum_Extensible_String_UnKnown_Value.put;

const Type_Enum_Extensible_ApiVersion_Known_Value = createMockServerTests(
  `/type/enum/extensible/api-version/known-value`,
  "2020-01-01",
);
Scenarios.Type_Enum_Extensible_ApiVersion_getKnownValue =
  Type_Enum_Extensible_ApiVersion_Known_Value.get;
Scenarios.Type_Enum_Extensible_ApiVersion_putKnownValue =
  Type_Enum_Extensible_ApiVersion_Known_Value.put;

const Type_Enum_Extensible_ApiVersion_UnKnown_Value = createMockServerTests(
  `/type/enum/extensible/api-version/unknown-value`,
  "2022-01-01",
);
Scenarios.Type_Enum_Extensible_ApiVersion_getUnknownValue =
  Type_Enum_Extensible_ApiVersion_UnKnown_Value.get;
Scenarios.Type_Enum_Extensible_ApiVersion_putUnknownValue =
  Type_Enum_Extensible_ApiVersion_UnKnown_Value.put;

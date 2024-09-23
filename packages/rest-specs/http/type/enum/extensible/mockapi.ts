import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Known Values
Scenarios.Type_Enum_Extensible_String_getKnownValue = passOnSuccess(
  mockapi.get("/type/enum/extensible/string/known-value", (req) => {
    return { status: 200, body: json("Monday") };
  }),
);

Scenarios.Type_Enum_Extensible_String_putKnownValue = passOnSuccess(
  mockapi.put("/type/enum/extensible/string/known-value", (req) => {
    req.expect.bodyEquals("Monday");
    return { status: 204 };
  }),
);

// Unknown values
Scenarios.Type_Enum_Extensible_String_getUnknownValue = passOnSuccess(
  mockapi.get("/type/enum/extensible/string/unknown-value", (req) => {
    return { status: 200, body: json("Weekend") };
  }),
);

Scenarios.Type_Enum_Extensible_String_putUnknownValue = passOnSuccess(
  mockapi.put("/type/enum/extensible/string/unknown-value", (req) => {
    req.expect.bodyEquals("Weekend");
    return { status: 204 };
  }),
);

function createMockServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {},
        response: {
          status: 200,
          data: data,
        },
      },
      {
        method: "put",
        request: {
          body: data,
          config: {
            headers: {
              "Content-Type": "text/plain",
            },
          },
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Type_Enum_Extensible_String_Known_Value = createMockServerTests(
  `/type/enum/extensible/string/known-value`,
  "Monday",
);

Scenarios.Type_Enum_Extensible_String_UnKnown_Value = createMockServerTests(
  `/type/enum/extensible/string/unknown-value`,
  "Weekend",
);

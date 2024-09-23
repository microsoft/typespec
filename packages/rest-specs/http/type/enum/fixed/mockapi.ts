import { passOnSuccess, mockapi, json, passOnCode } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Known Values
Scenarios.Type_Enum_Fixed_String_getKnownValue = passOnSuccess(
  mockapi.get("/type/enum/fixed/string/known-value", (req) => {
    return { status: 200, body: json("Monday") };
  }),
);

Scenarios.Type_Enum_Fixed_String_putKnownValue = passOnSuccess(
  mockapi.put("/type/enum/fixed/string/known-value", (req) => {
    req.expect.bodyEquals("Monday");
    return { status: 204 };
  }),
);

// Unknown values
Scenarios.Type_Enum_Fixed_String_putUnknownValue = passOnCode(
  500,
  mockapi.put("/type/enum/fixed/string/unknown-value", (req) => {
    req.expect.bodyEquals("Weekend");
    return { status: 500 };
  }),
);

Scenarios.Type_Enum_Fixed_String_Known_Value = passOnSuccess({
  uri: "/type/enum/fixed/string/known-value",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: "Monday",
      },
    },
    {
      method: "put",
      request: {
        body: "Monday",
        config: {
          headers: {
            "Content-Type": "application/json",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Type_Enum_Fixed_String_Unknown_Value = passOnSuccess({
  uri: "/type/enum/fixed/string/unknown-value",
  mockMethods: [
    {
      method: "put",
      request: {
        body: "Weekend",
        config: {
          headers: {
            "Content-Type": "application/json",
          },
          validStatuses: [500],
        },
      },
      response: {
        status: 500,
      },
    },
  ],
});

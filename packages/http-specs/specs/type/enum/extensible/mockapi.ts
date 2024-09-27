import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createMockServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {},
        response: {
          status: 200,
          body: data,
        },
        handler: (req: MockRequest) => {
          return { status: 200, body: json(data) };
        },
      },
      {
        method: "put",
        request: {
          body: data,
          headers: {
            "Content-Type": "text/plain",
          },
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          req.expect.bodyEquals(data);
          return { status: 204 };
        },
      },
    ],
    kind: "MockApiDefinition",
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

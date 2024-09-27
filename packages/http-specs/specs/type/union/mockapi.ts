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
          body: { prop: value },
        },
        handler: (req: MockRequest) => {
          return { status: 200, body: json({ prop: value }) };
        },
      },
      {
        method: `post`,
        request: {
          body: {
            prop: value,
          },
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          req.expect.bodyEquals({ prop: value });
          return { status: 204 };
        },
      },
    ],
    kind: "MockApiDefinition",
  });
}

Scenarios.Type_Union_Strings_Only = createServerTests(`/type/union/strings-only`, "b");
Scenarios.Type_Union_Strings_Extensible = createServerTests(
  `/type/union/string-extensible`,
  "custom",
);
Scenarios.Type_Union_Strings_Extensible_Named = createServerTests(
  `/type/union/string-extensible-named`,
  "custom",
);
Scenarios.Type_Union_Ints_Only = createServerTests(`/type/union/ints-only`, 2);
Scenarios.Type_Union_Floats_Only = createServerTests(`/type/union/floats-only`, 2.2);
Scenarios.Type_Union_Models_Only = createServerTests(`/type/union/models-only`, { name: "test" });
Scenarios.Type_Union_Enums_Only = createServerTests(`/type/union/enums-only`, {
  lr: "right",
  ud: "up",
});
Scenarios.Type_Union_String_And_Array = createServerTests(`/type/union/string-and-array`, {
  string: "test",
  array: ["test1", "test2"],
});
Scenarios.Type_Union_Mixed_Literals = createServerTests(`/type/union/mixed-literals`, {
  stringLiteral: "a",
  intLiteral: 2,
  floatLiteral: 3.3,
  booleanLiteral: true,
});
Scenarios.Type_Union_Mixed_Types = createServerTests(`/type/union/mixed-types`, {
  model: {
    name: "test",
  },
  literal: "a",
  int: 2,
  boolean: true,
  array: [
    {
      name: "test",
    },
    "a",
    2,
    true,
  ],
});

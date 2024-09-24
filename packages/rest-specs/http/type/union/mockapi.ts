import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createGetSendScenario(url: string, value: unknown) {
  return {
    get: passOnSuccess(
      mockapi.get(url, (req) => {
        return { status: 200, body: json({ prop: value }) };
      }),
    ),
    send: passOnSuccess(
      mockapi.post(url, (req) => {
        req.expect.bodyEquals({ prop: value });
        return { status: 204 };
      }),
    ),
  };
}
const Type_Union_StringsOnly = createGetSendScenario("/type/union/strings-only", "b");
Scenarios.Type_Union_StringsOnly_get = Type_Union_StringsOnly.get;
Scenarios.Type_Union_StringsOnly_send = Type_Union_StringsOnly.send;

const Type_Union_StringExtensible = createGetSendScenario(
  "/type/union/string-extensible",
  "custom",
);
Scenarios.Type_Union_StringExtensible_get = Type_Union_StringExtensible.get;
Scenarios.Type_Union_StringExtensible_send = Type_Union_StringExtensible.send;

const Type_Union_StringExtensibleNamed = createGetSendScenario(
  "/type/union/string-extensible-named",
  "custom",
);
Scenarios.Type_Union_StringExtensibleNamed_get = Type_Union_StringExtensibleNamed.get;
Scenarios.Type_Union_StringExtensibleNamed_send = Type_Union_StringExtensibleNamed.send;

const Type_Union_IntsOnly = createGetSendScenario("/type/union/ints-only", 2);
Scenarios.Type_Union_IntsOnly_get = Type_Union_IntsOnly.get;
Scenarios.Type_Union_IntsOnly_send = Type_Union_IntsOnly.send;

const Type_Union_FloatsOnly = createGetSendScenario("/type/union/floats-only", 2.2);
Scenarios.Type_Union_FloatsOnly_get = Type_Union_FloatsOnly.get;
Scenarios.Type_Union_FloatsOnly_send = Type_Union_FloatsOnly.send;

const Type_Union_ModelsOnly = createGetSendScenario("/type/union/models-only", { name: "test" });
Scenarios.Type_Union_ModelsOnly_get = Type_Union_ModelsOnly.get;
Scenarios.Type_Union_ModelsOnly_send = Type_Union_ModelsOnly.send;

const Type_Union_EnumsOnly = createGetSendScenario("/type/union/enums-only", {
  lr: "right",
  ud: "up",
});
Scenarios.Type_Union_EnumsOnly_get = Type_Union_EnumsOnly.get;
Scenarios.Type_Union_EnumsOnly_send = Type_Union_EnumsOnly.send;

const Type_Union_StringAndArray = createGetSendScenario("/type/union/string-and-array", {
  string: "test",
  array: ["test1", "test2"],
});
Scenarios.Type_Union_StringAndArray_get = Type_Union_StringAndArray.get;
Scenarios.Type_Union_StringAndArray_send = Type_Union_StringAndArray.send;

const Type_Union_MixedLiterals = createGetSendScenario("/type/union/mixed-literals", {
  stringLiteral: "a",
  intLiteral: 2,
  floatLiteral: 3.3,
  booleanLiteral: true,
});
Scenarios.Type_Union_MixedLiterals_get = Type_Union_MixedLiterals.get;
Scenarios.Type_Union_MixedLiterals_send = Type_Union_MixedLiterals.send;

const Type_Union_MixedTypes = createGetSendScenario("/type/union/mixed-types", {
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
Scenarios.Type_Union_MixedTypes_get = Type_Union_MixedTypes.get;
Scenarios.Type_Union_MixedTypes_send = Type_Union_MixedTypes.send;

function createServerTests(url: string, value: unknown) {
  return passOnSuccess({
    uri: url,
    mockMethods: [
      {
        method: `get`,
        request: {},
        response: {
          status: 200,
          data: { prop: value },
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
      },
    ],
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

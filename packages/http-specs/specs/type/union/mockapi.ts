import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createGetServerTests(url: string, value: unknown) {
  return passOnSuccess({
    uri: url,
    method: `get`,
    request: {},
    response: {
      status: 200,
      body: json({ prop: value }),
    },
    kind: "MockApiDefinition",
  });
}

function createPostServerTests(url: string, value: unknown) {
  return passOnSuccess({
    uri: url,
    method: `post`,
    request: {
      body: json({
        prop: value,
      }),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.Type_Union_StringsOnly_get = createGetServerTests(`/type/union/strings-only`, "b");
Scenarios.Type_Union_StringsOnly_send = createPostServerTests(`/type/union/strings-only`, "b");

Scenarios.Type_Union_StringExtensible_get = createGetServerTests(
  `/type/union/string-extensible`,
  "custom",
);
Scenarios.Type_Union_StringExtensible_send = createPostServerTests(
  `/type/union/string-extensible`,
  "custom",
);

Scenarios.Type_Union_StringExtensibleNamed_get = createGetServerTests(
  `/type/union/string-extensible-named`,
  "custom",
);
Scenarios.Type_Union_StringExtensibleNamed_send = createPostServerTests(
  `/type/union/string-extensible-named`,
  "custom",
);

Scenarios.Type_Union_IntsOnly_get = createGetServerTests(`/type/union/ints-only`, 2);
Scenarios.Type_Union_IntsOnly_send = createPostServerTests(`/type/union/ints-only`, 2);

Scenarios.Type_Union_FloatsOnly_get = createGetServerTests(`/type/union/floats-only`, 2.2);
Scenarios.Type_Union_FloatsOnly_send = createPostServerTests(`/type/union/floats-only`, 2.2);

Scenarios.Type_Union_ModelsOnly_get = createGetServerTests(`/type/union/models-only`, {
  name: "test",
});
Scenarios.Type_Union_ModelsOnly_send = createPostServerTests(`/type/union/models-only`, {
  name: "test",
});

Scenarios.Type_Union_EnumsOnly_get = createGetServerTests(`/type/union/enums-only`, {
  lr: "right",
  ud: "up",
});
Scenarios.Type_Union_EnumsOnly_send = createPostServerTests(`/type/union/enums-only`, {
  lr: "right",
  ud: "up",
});

Scenarios.Type_Union_StringAndArray_get = createGetServerTests(`/type/union/string-and-array`, {
  string: "test",
  array: ["test1", "test2"],
});
Scenarios.Type_Union_StringAndArray_send = createPostServerTests(`/type/union/string-and-array`, {
  string: "test",
  array: ["test1", "test2"],
});

Scenarios.Type_Union_MixedLiterals_get = createGetServerTests(`/type/union/mixed-literals`, {
  stringLiteral: "a",
  intLiteral: 2,
  floatLiteral: 3.3,
  booleanLiteral: true,
});
Scenarios.Type_Union_MixedLiterals_send = createPostServerTests(`/type/union/mixed-literals`, {
  stringLiteral: "a",
  intLiteral: 2,
  floatLiteral: 3.3,
  booleanLiteral: true,
});

Scenarios.Type_Union_MixedTypes_get = createGetServerTests(`/type/union/mixed-types`, {
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
Scenarios.Type_Union_MixedTypes_send = createPostServerTests(`/type/union/mixed-types`, {
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

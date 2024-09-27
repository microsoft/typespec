import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {},
        response: {
          status: 200,
          body: json(data),
        },
        handler: (req: MockRequest) => {
          return {
            status: 200,
            body: json(data),
          };
        },
      },
      {
        method: "put",
        request: {
          body: data,
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          req.expect.coercedBodyEquals(data);
          return {
            status: 204,
          };
        },
      },
    ],
    kind: "MockApiDefinition",
  });
}

Scenarios.Type_Dictionary_Int32 = createServerTests(`/type/dictionary/int32`, { k1: 1, k2: 2 });
Scenarios.Type_Dictionary_Int64 = createServerTests(`/type/dictionary/int64`, {
  k1: Number.MAX_SAFE_INTEGER,
  k2: Number.MIN_SAFE_INTEGER,
});
Scenarios.Type_Dictionary_Boolean = createServerTests(`/type/dictionary/boolean`, {
  k1: true,
  k2: false,
});
Scenarios.Type_Dictionary_String = createServerTests(`/type/dictionary/string`, {
  k1: "hello",
  k2: "",
});
Scenarios.Type_Dictionary_Float32 = createServerTests(`/type/dictionary/float32`, { k1: 43.125 });
Scenarios.Type_Dictionary_Datetime = createServerTests(`/type/dictionary/datetime`, {
  k1: "2022-08-26T18:38:00Z",
});
Scenarios.Type_Dictionary_Duration = createServerTests(`/type/dictionary/duration`, {
  k1: "P123DT22H14M12.011S",
});
Scenarios.Type_Dictionary_Unknown = createServerTests(`/type/dictionary/unknown`, {
  k1: 1,
  k2: "hello",
  k3: null,
});
Scenarios.Type_Dictionary_Model = createServerTests(`/type/dictionary/model`, {
  k1: { property: "hello" },
  k2: { property: "world" },
});
Scenarios.Type_Dictionary_Model_Recursive = createServerTests(`/type/dictionary/model/recursive`, {
  k1: { property: "hello", children: {} },
  k2: {
    property: "world",
    children: { "k2.1": { property: "inner world" } },
  },
});
Scenarios.Type_Dictionary_Nullable_Float = createServerTests(`/type/dictionary/nullable-float`, {
  k1: 1.25,
  k2: 0.5,
  k3: null,
});

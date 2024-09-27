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
          body: data,
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

Scenarios.Type_Array_Int32 = createServerTests(`/type/array/int32`, [1, 2]);
Scenarios.Type_Array_Int64 = createServerTests(`/type/array/int64`, [
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
]);
Scenarios.Type_Array_Boolean = createServerTests(`/type/array/boolean`, [true, false]);
Scenarios.Type_Array_String = createServerTests(`/type/array/string`, ["hello", ""]);
Scenarios.Type_Array_Float32 = createServerTests(`/type/array/float32`, [43.125]);
Scenarios.Type_Array_Datetime = createServerTests(`/type/array/datetime`, ["2022-08-26T18:38:00Z"]);
Scenarios.Type_Array_Duration = createServerTests(`/type/array/duration`, ["P123DT22H14M12.011S"]);
Scenarios.Type_Array_Unknown = createServerTests(`/type/array/unknown`, [1, "hello", null]);
Scenarios.Type_Array_Model = createServerTests(`/type/array/model`, [
  { property: "hello" },
  { property: "world" },
]);
Scenarios.Type_Array_Nullable_Float = createServerTests(`/type/array/nullable-float`, [
  1.25,
  null,
  3.0,
]);
Scenarios.Type_Array_Nullable_Boolean = createServerTests(`/type/array/nullable-boolean`, [
  true,
  null,
  false,
]);
Scenarios.Type_Array_Nullable_Int32 = createServerTests(`/type/array/nullable-int32`, [1, null, 3]);
Scenarios.Type_Array_Nullable_String = createServerTests(`/type/array/nullable-string`, [
  "hello",
  null,
  "world",
]);
Scenarios.Type_Array_Nullable_Model = createServerTests(`/type/array/nullable-model`, [
  { property: "hello" },
  null,
  { property: "world" },
]);

import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function createServerTests(uri: string, data: any) {
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
      },
      response: {
        status: 204,
      },
      kind: "MockApiDefinition",
    }),
  };
}

const Type_Array_Int32 = createServerTests(`/type/array/int32`, [1, 2]);
Scenarios.Type_Array_Int32Value_get = Type_Array_Int32.get;
Scenarios.Type_Array_Int32Value_put = Type_Array_Int32.put;

const Type_Array_Int64 = createServerTests(`/type/array/int64`, [
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
]);
Scenarios.Type_Array_Int64Value_get = Type_Array_Int64.get;
Scenarios.Type_Array_Int64Value_put = Type_Array_Int64.put;

const Type_Array_Boolean = createServerTests(`/type/array/boolean`, [true, false]);
Scenarios.Type_Array_BooleanValue_get = Type_Array_Boolean.get;
Scenarios.Type_Array_BooleanValue_put = Type_Array_Boolean.put;

const Type_Array_String = createServerTests(`/type/array/string`, ["hello", ""]);
Scenarios.Type_Array_StringValue_get = Type_Array_String.get;
Scenarios.Type_Array_StringValue_put = Type_Array_String.put;

const Type_Array_Float32 = createServerTests(`/type/array/float32`, [43.125]);
Scenarios.Type_Array_Float32Value_get = Type_Array_Float32.get;
Scenarios.Type_Array_Float32Value_put = Type_Array_Float32.put;

const Type_Array_Datetime = createServerTests(`/type/array/datetime`, ["2022-08-26T18:38:00Z"]);
Scenarios.Type_Array_DatetimeValue_get = Type_Array_Datetime.get;
Scenarios.Type_Array_DatetimeValue_put = Type_Array_Datetime.put;

const Type_Array_Duration = createServerTests(`/type/array/duration`, ["P123DT22H14M12.011S"]);
Scenarios.Type_Array_DurationValue_get = Type_Array_Duration.get;
Scenarios.Type_Array_DurationValue_put = Type_Array_Duration.put;

const Type_Array_Unknown = createServerTests(`/type/array/unknown`, [1, "hello", null]);
Scenarios.Type_Array_UnknownValue_get = Type_Array_Unknown.get;
Scenarios.Type_Array_UnknownValue_put = Type_Array_Unknown.put;

const Type_Array_Model = createServerTests(`/type/array/model`, [
  { property: "hello" },
  { property: "world" },
]);
Scenarios.Type_Array_ModelValue_get = Type_Array_Model.get;
Scenarios.Type_Array_ModelValue_put = Type_Array_Model.put;

const Type_Array_Nullable_Float = createServerTests(`/type/array/nullable-float`, [
  1.25,
  null,
  3.0,
]);
Scenarios.Type_Array_NullableFloatValue_get = Type_Array_Nullable_Float.get;
Scenarios.Type_Array_NullableFloatValue_put = Type_Array_Nullable_Float.put;

const Type_Array_Nullable_Boolean = createServerTests(`/type/array/nullable-boolean`, [
  true,
  null,
  false,
]);
Scenarios.Type_Array_NullableBooleanValue_get = Type_Array_Nullable_Boolean.get;
Scenarios.Type_Array_NullableBooleanValue_put = Type_Array_Nullable_Boolean.put;

const Type_Array_Nullable_Int32 = createServerTests(`/type/array/nullable-int32`, [1, null, 3]);
Scenarios.Type_Array_NullableInt32Value_get = Type_Array_Nullable_Int32.get;
Scenarios.Type_Array_NullableInt32Value_put = Type_Array_Nullable_Int32.put;

const Type_Array_Nullable_String = createServerTests(`/type/array/nullable-string`, [
  "hello",
  null,
  "world",
]);
Scenarios.Type_Array_NullableStringValue_get = Type_Array_Nullable_String.get;
Scenarios.Type_Array_NullableStringValue_put = Type_Array_Nullable_String.put;

const Type_Array_Nullable_Model = createServerTests(`/type/array/nullable-model`, [
  { property: "hello" },
  null,
  { property: "world" },
]);
Scenarios.Type_Array_NullableModelValue_get = Type_Array_Nullable_Model.get;
Scenarios.Type_Array_NullableModelValue_put = Type_Array_Nullable_Model.put;

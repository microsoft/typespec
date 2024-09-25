import { json, mockapi, MockApi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

interface MockApiGetPut {
  get: MockApi;
  put: MockApi;
}

/**
 * Return the get and put operations
 * @param route The route within /dictionary for your function.
 * @param value The value you are expecting and will return.
 */
function createModelMockApis(route: string, value: any[]): MockApiGetPut {
  const url = `/type/array/${route}`;
  return {
    get: mockapi.get(url, (req) => {
      return {
        status: 200,
        body: json(value),
      };
    }),
    put: mockapi.put(url, (req) => {
      req.expect.coercedBodyEquals(value);
      return {
        status: 204,
      };
    }),
  };
}

const Int32ValueMock = createModelMockApis("int32", [1, 2]);
Scenarios.Type_Array_Int32Value_get = passOnSuccess(Int32ValueMock.get);
Scenarios.Type_Array_Int32Value_put = passOnSuccess(Int32ValueMock.put);

const Int64ValueMock = createModelMockApis("int64", [
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
]);
Scenarios.Type_Array_Int64Value_get = passOnSuccess(Int64ValueMock.get);
Scenarios.Type_Array_Int64Value_put = passOnSuccess(Int64ValueMock.put);

const BooleanValueMock = createModelMockApis("boolean", [true, false]);
Scenarios.Type_Array_BooleanValue_get = passOnSuccess(BooleanValueMock.get);
Scenarios.Type_Array_BooleanValue_put = passOnSuccess(BooleanValueMock.put);

const StringValueMock = createModelMockApis("string", ["hello", ""]);
Scenarios.Type_Array_StringValue_get = passOnSuccess(StringValueMock.get);
Scenarios.Type_Array_StringValue_put = passOnSuccess(StringValueMock.put);

const Float32ValueMock = createModelMockApis("float32", [43.125]);
Scenarios.Type_Array_Float32Value_get = passOnSuccess(Float32ValueMock.get);
Scenarios.Type_Array_Float32Value_put = passOnSuccess(Float32ValueMock.put);

const DatetimeValueMock = createModelMockApis("datetime", ["2022-08-26T18:38:00Z"]);
Scenarios.Type_Array_DatetimeValue_get = passOnSuccess(DatetimeValueMock.get);
Scenarios.Type_Array_DatetimeValue_put = passOnSuccess(DatetimeValueMock.put);

const DurationValueMock = createModelMockApis("duration", ["P123DT22H14M12.011S"]);
Scenarios.Type_Array_DurationValue_get = passOnSuccess(DurationValueMock.get);
Scenarios.Type_Array_DurationValue_put = passOnSuccess(DurationValueMock.put);

const UnknownValueMock = createModelMockApis("unknown", [1, "hello", null]);
Scenarios.Type_Array_UnknownValue_get = passOnSuccess(UnknownValueMock.get);
Scenarios.Type_Array_UnknownValue_put = passOnSuccess(UnknownValueMock.put);

const ModelValueMock = createModelMockApis("model", [{ property: "hello" }, { property: "world" }]);
Scenarios.Type_Array_ModelValue_get = passOnSuccess(ModelValueMock.get);
Scenarios.Type_Array_ModelValue_put = passOnSuccess(ModelValueMock.put);

const NullableFloatMock = createModelMockApis("nullable-float", [1.25, null, 3.0]);
Scenarios.Type_Array_NullableFloatValue_get = passOnSuccess(NullableFloatMock.get);
Scenarios.Type_Array_NullableFloatValue_put = passOnSuccess(NullableFloatMock.put);

const NullableInt32Mock = createModelMockApis("nullable-int32", [1, null, 3]);
Scenarios.Type_Array_NullableInt32Value_get = passOnSuccess(NullableInt32Mock.get);
Scenarios.Type_Array_NullableInt32Value_put = passOnSuccess(NullableInt32Mock.put);

const NullableStringMock = createModelMockApis("nullable-string", ["hello", null, "world"]);
Scenarios.Type_Array_NullableStringValue_get = passOnSuccess(NullableStringMock.get);
Scenarios.Type_Array_NullableStringValue_put = passOnSuccess(NullableStringMock.put);

const NullableBooleanMock = createModelMockApis("nullable-boolean", [true, null, false]);
Scenarios.Type_Array_NullableBooleanValue_get = passOnSuccess(NullableBooleanMock.get);
Scenarios.Type_Array_NullableBooleanValue_put = passOnSuccess(NullableBooleanMock.put);

const NullableModelMock = createModelMockApis("nullable-model", [
  { property: "hello" },
  null,
  { property: "world" },
]);
Scenarios.Type_Array_NullableModelValue_get = passOnSuccess(NullableModelMock.get);
Scenarios.Type_Array_NullableModelValue_put = passOnSuccess(NullableModelMock.put);

function createServerTests(uri: string, data: any) {
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
        },
        response: {
          status: 204,
        },
      },
    ],
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

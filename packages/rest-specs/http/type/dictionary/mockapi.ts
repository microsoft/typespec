import { passOnSuccess, ScenarioMockApi, mockapi, json, MockApi } from "@typespec/spec-api";

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
function createModelMockApis(route: string, value: any): MockApiGetPut {
  const url = `/type/dictionary/${route}`;
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

const Int32ValueMock = createModelMockApis("int32", { k1: 1, k2: 2 });
Scenarios.Type_Dictionary_Int32Value_get = passOnSuccess(Int32ValueMock.get);
Scenarios.Type_Dictionary_Int32Value_put = passOnSuccess(Int32ValueMock.put);

const Int64ValueMock = createModelMockApis("int64", { k1: Number.MAX_SAFE_INTEGER, k2: Number.MIN_SAFE_INTEGER });
Scenarios.Type_Dictionary_Int64Value_get = passOnSuccess(Int64ValueMock.get);
Scenarios.Type_Dictionary_Int64Value_put = passOnSuccess(Int64ValueMock.put);

const BooleanValueMock = createModelMockApis("boolean", { k1: true, k2: false });
Scenarios.Type_Dictionary_BooleanValue_get = passOnSuccess(BooleanValueMock.get);
Scenarios.Type_Dictionary_BooleanValue_put = passOnSuccess(BooleanValueMock.put);

const StringValueMock = createModelMockApis("string", { k1: "hello", k2: "" });
Scenarios.Type_Dictionary_StringValue_get = passOnSuccess(StringValueMock.get);
Scenarios.Type_Dictionary_StringValue_put = passOnSuccess(StringValueMock.put);

const Float32ValueMock = createModelMockApis("float32", { k1: 43.125 });
Scenarios.Type_Dictionary_Float32Value_get = passOnSuccess(Float32ValueMock.get);
Scenarios.Type_Dictionary_Float32Value_put = passOnSuccess(Float32ValueMock.put);

const DatetimeValueMock = createModelMockApis("datetime", { k1: "2022-08-26T18:38:00Z" });
Scenarios.Type_Dictionary_DatetimeValue_get = passOnSuccess(DatetimeValueMock.get);
Scenarios.Type_Dictionary_DatetimeValue_put = passOnSuccess(DatetimeValueMock.put);

const DurationValueMock = createModelMockApis("duration", { k1: "P123DT22H14M12.011S" });
Scenarios.Type_Dictionary_DurationValue_get = passOnSuccess(DurationValueMock.get);
Scenarios.Type_Dictionary_DurationValue_put = passOnSuccess(DurationValueMock.put);

const UnknownValueMock = createModelMockApis("unknown", { k1: 1, k2: "hello", k3: null });
Scenarios.Type_Dictionary_UnknownValue_get = passOnSuccess(UnknownValueMock.get);
Scenarios.Type_Dictionary_UnknownValue_put = passOnSuccess(UnknownValueMock.put);

const ModelValueMock = createModelMockApis("model", {
  k1: { property: "hello" },
  k2: { property: "world" },
});
Scenarios.Type_Dictionary_ModelValue_get = passOnSuccess(ModelValueMock.get);
Scenarios.Type_Dictionary_ModelValue_put = passOnSuccess(ModelValueMock.put);

const RecursiveValueMock = createModelMockApis("model/recursive", {
  k1: { property: "hello", children: {} },
  k2: { property: "world", children: { "k2.1": { property: "inner world" } } },
});
Scenarios.Type_Dictionary_RecursiveModelValue_get = passOnSuccess(RecursiveValueMock.get);
Scenarios.Type_Dictionary_RecursiveModelValue_put = passOnSuccess(RecursiveValueMock.put);

const NullableFloatValueMock = createModelMockApis("nullable-float", { k1: 1.25, k2: 0.5, k3: null });
Scenarios.Type_Dictionary_NullableFloatValue_get = passOnSuccess(NullableFloatValueMock.get);
Scenarios.Type_Dictionary_NullableFloatValue_put = passOnSuccess(NullableFloatValueMock.put);

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

Scenarios.Type_Dictionary_Int32 = createServerTests(`/type/dictionary/int32`, { k1: 1, k2: 2 });
Scenarios.Type_Dictionary_Int64 = createServerTests(`/type/dictionary/int64`, {
  k1: Number.MAX_SAFE_INTEGER,
  k2: Number.MIN_SAFE_INTEGER,
});
Scenarios.Type_Dictionary_Boolean = createServerTests(`/type/dictionary/boolean`, { k1: true, k2: false });
Scenarios.Type_Dictionary_String = createServerTests(`/type/dictionary/string`, { k1: "hello", k2: "" });
Scenarios.Type_Dictionary_Float32 = createServerTests(`/type/dictionary/float32`, { k1: 43.125 });
Scenarios.Type_Dictionary_Datetime = createServerTests(`/type/dictionary/datetime`, { k1: "2022-08-26T18:38:00Z" });
Scenarios.Type_Dictionary_Duration = createServerTests(`/type/dictionary/duration`, { k1: "P123DT22H14M12.011S" });
Scenarios.Type_Dictionary_Unknown = createServerTests(`/type/dictionary/unknown`, { k1: 1, k2: "hello", k3: null });
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

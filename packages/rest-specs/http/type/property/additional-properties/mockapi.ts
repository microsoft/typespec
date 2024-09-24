import { json, mockapi, MockApi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

interface MockApiGetPut {
  get: MockApi;
  put: MockApi;
}

/**
 * Return the get and put operations
 * @param route The route within /models/properties for your function.
 * @param value The value you are expecting and will return.
 */
function createMockApis(route: string, value: any): MockApiGetPut {
  const url = `/type/property/additionalProperties/${route}`;
  const body = value;
  return {
    get: mockapi.get(url, (req) => {
      return {
        status: 200,
        body: json(body),
      };
    }),
    put: mockapi.put(url, (req) => {
      const expectedBody = JSON.parse(JSON.stringify(body));
      req.expect.coercedBodyEquals(expectedBody);
      return {
        status: 204,
      };
    }),
  };
}
// **************************************************** Record<unknown> ****************************************************
const extendsUnknown = createMockApis("extendsRecordUnknown", {
  name: "ExtendsUnknownAdditionalProperties",
  prop1: 32,
  prop2: true,
  prop3: "abc",
});
Scenarios.Type_Property_AdditionalProperties_ExtendsUnknown_get = passOnSuccess(extendsUnknown.get);
Scenarios.Type_Property_AdditionalProperties_ExtendsUnknown_put = passOnSuccess(extendsUnknown.put);

const extendsUnknownDerived = createMockApis("extendsRecordUnknownDerived", {
  name: "ExtendsUnknownAdditionalProperties",
  index: 314,
  age: 2.71875,
  prop1: 32,
  prop2: true,
  prop3: "abc",
});
Scenarios.Type_Property_AdditionalProperties_ExtendsUnknownDerived_get = passOnSuccess(
  extendsUnknownDerived.get,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsUnknownDerived_put = passOnSuccess(
  extendsUnknownDerived.put,
);

const extendsUnknownDiscriminated = createMockApis("extendsUnknownDiscriminated", {
  kind: "derived",
  name: "Derived",
  index: 314,
  age: 2.71875,
  prop1: 32,
  prop2: true,
  prop3: "abc",
});
Scenarios.Type_Property_AdditionalProperties_ExtendsUnknownDiscriminated_get = passOnSuccess(
  extendsUnknownDiscriminated.get,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsUnknownDiscriminated_put = passOnSuccess(
  extendsUnknownDiscriminated.put,
);

const isUnknown = createMockApis("isRecordUnknown", {
  name: "IsUnknownAdditionalProperties",
  prop1: 32,
  prop2: true,
  prop3: "abc",
});
Scenarios.Type_Property_AdditionalProperties_IsUnknown_get = passOnSuccess(isUnknown.get);
Scenarios.Type_Property_AdditionalProperties_IsUnknown_put = passOnSuccess(isUnknown.put);

const isUnknownDerived = createMockApis("isRecordUnknownDerived", {
  name: "IsUnknownAdditionalProperties",
  index: 314,
  age: 2.71875,
  prop1: 32,
  prop2: true,
  prop3: "abc",
});
Scenarios.Type_Property_AdditionalProperties_IsUnknownDerived_get = passOnSuccess(
  isUnknownDerived.get,
);
Scenarios.Type_Property_AdditionalProperties_IsUnknownDerived_put = passOnSuccess(
  isUnknownDerived.put,
);

const isUnknownDiscriminated = createMockApis("isUnknownDiscriminated", {
  kind: "derived",
  name: "Derived",
  index: 314,
  age: 2.71875,
  prop1: 32,
  prop2: true,
  prop3: "abc",
});
Scenarios.Type_Property_AdditionalProperties_IsUnknownDiscriminated_get = passOnSuccess(
  isUnknownDiscriminated.get,
);
Scenarios.Type_Property_AdditionalProperties_IsUnknownDiscriminated_put = passOnSuccess(
  isUnknownDiscriminated.put,
);

// **************************************************** Record<string> ****************************************************
const extendsString = createMockApis("extendsRecordString", {
  name: "ExtendsStringAdditionalProperties",
  prop: "abc",
});
Scenarios.Type_Property_AdditionalProperties_ExtendsString_get = passOnSuccess(extendsString.get);
Scenarios.Type_Property_AdditionalProperties_ExtendsString_put = passOnSuccess(extendsString.put);

const isString = createMockApis("isRecordString", {
  name: "IsStringAdditionalProperties",
  prop: "abc",
});
Scenarios.Type_Property_AdditionalProperties_IsString_get = passOnSuccess(isString.get);
Scenarios.Type_Property_AdditionalProperties_IsString_put = passOnSuccess(isString.put);

const spreadString = createMockApis("spreadRecordString", {
  name: "SpreadSpringRecord",
  prop: "abc",
});
Scenarios.Type_Property_AdditionalProperties_SpreadString_get = passOnSuccess(spreadString.get);
Scenarios.Type_Property_AdditionalProperties_SpreadString_put = passOnSuccess(spreadString.put);

// **************************************************** Record<float32> ****************************************************
const recordFloatBody = {
  id: 43.125,
  prop: 43.125,
};
const extendsFloat = createMockApis("extendsRecordFloat", recordFloatBody);
Scenarios.Type_Property_AdditionalProperties_ExtendsFloat_get = passOnSuccess(extendsFloat.get);
Scenarios.Type_Property_AdditionalProperties_ExtendsFloat_put = passOnSuccess(extendsFloat.put);

const isFloat = createMockApis("isRecordFloat", recordFloatBody);
Scenarios.Type_Property_AdditionalProperties_IsFloat_get = passOnSuccess(isFloat.get);
Scenarios.Type_Property_AdditionalProperties_IsFloat_put = passOnSuccess(isFloat.put);

const spreadFloat = createMockApis("spreadRecordFloat", recordFloatBody);
Scenarios.Type_Property_AdditionalProperties_SpreadFloat_get = passOnSuccess(spreadFloat.get);
Scenarios.Type_Property_AdditionalProperties_SpreadFloat_put = passOnSuccess(spreadFloat.put);

// **************************************************** Record<Model> ****************************************************
const recordModelBody = {
  knownProp: { state: "ok" },
  prop: { state: "ok" },
};
const extendsModel = createMockApis("extendsRecordModel", recordModelBody);
Scenarios.Type_Property_AdditionalProperties_ExtendsModel_get = passOnSuccess(extendsModel.get);
Scenarios.Type_Property_AdditionalProperties_ExtendsModel_put = passOnSuccess(extendsModel.put);

const isModel = createMockApis("isRecordModel", recordModelBody);
Scenarios.Type_Property_AdditionalProperties_IsModel_get = passOnSuccess(isModel.get);
Scenarios.Type_Property_AdditionalProperties_IsModel_put = passOnSuccess(isModel.put);

const spreadModel = createMockApis("spreadRecordModel", recordModelBody);
Scenarios.Type_Property_AdditionalProperties_SpreadModel_get = passOnSuccess(spreadModel.get);
Scenarios.Type_Property_AdditionalProperties_SpreadModel_put = passOnSuccess(spreadModel.put);

// **************************************************** Record<Model[]> ****************************************************
const recordModelArrayBody = {
  knownProp: [{ state: "ok" }, { state: "ok" }],
  prop: [{ state: "ok" }, { state: "ok" }],
};
const extendsModelArray = createMockApis("extendsRecordModelArray", recordModelArrayBody);
Scenarios.Type_Property_AdditionalProperties_ExtendsModelArray_get = passOnSuccess(
  extendsModelArray.get,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsModelArray_put = passOnSuccess(
  extendsModelArray.put,
);

const isModelArray = createMockApis("isRecordModelArray", recordModelArrayBody);
Scenarios.Type_Property_AdditionalProperties_IsModelArray_get = passOnSuccess(isModelArray.get);
Scenarios.Type_Property_AdditionalProperties_IsModelArray_put = passOnSuccess(isModelArray.put);

const spreadModelArray = createMockApis("spreadRecordModelArray", recordModelArrayBody);
Scenarios.Type_Property_AdditionalProperties_SpreadModelArray_get = passOnSuccess(
  spreadModelArray.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadModelArray_put = passOnSuccess(
  spreadModelArray.put,
);

// **************************************************** Spread different Record type ****************************************************
const differentRecordStringBody = {
  id: 43.125,
  prop: "abc",
};
const spreadDifferentRecordString = createMockApis(
  "spreadDifferentRecordString",
  differentRecordStringBody,
);
Scenarios.Type_Property_AdditionalProperties_SpreadDifferentString_get = passOnSuccess(
  spreadDifferentRecordString.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadDifferentString_put = passOnSuccess(
  spreadDifferentRecordString.put,
);

const differentRecordFloatBody = {
  name: "abc",
  prop: 43.125,
};
const spreadDifferentRecordFloat = createMockApis(
  "spreadDifferentRecordFloat",
  differentRecordFloatBody,
);
Scenarios.Type_Property_AdditionalProperties_SpreadDifferentFloat_get = passOnSuccess(
  spreadDifferentRecordFloat.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadDifferentFloat_put = passOnSuccess(
  spreadDifferentRecordFloat.put,
);

const differentRecordModelBody = {
  knownProp: "abc",
  prop: { state: "ok" },
};

const spreadDifferentRecordModel = createMockApis(
  "spreadDifferentRecordModel",
  differentRecordModelBody,
);
Scenarios.Type_Property_AdditionalProperties_SpreadDifferentModel_get = passOnSuccess(
  spreadDifferentRecordModel.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadDifferentModel_put = passOnSuccess(
  spreadDifferentRecordModel.put,
);

const differentRecordModelArrayBody = {
  knownProp: "abc",
  prop: [{ state: "ok" }, { state: "ok" }],
};
const spreadDifferentRecordModelArray = createMockApis(
  "spreadDifferentRecordModelArray",
  differentRecordModelArrayBody,
);
Scenarios.Type_Property_AdditionalProperties_SpreadDifferentModelArray_get = passOnSuccess(
  spreadDifferentRecordModelArray.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadDifferentModelArray_put = passOnSuccess(
  spreadDifferentRecordModelArray.put,
);

// **************************************************** extends from a model has spread Record<string> ****************************************************
const extendsModelSpreadStringBody = {
  id: 43.125,
  prop: "abc",
  derivedProp: "abc",
};

const extendsModelSpreadString = createMockApis(
  "extendsDifferentSpreadString",
  extendsModelSpreadStringBody,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsDifferentSpreadString_get = passOnSuccess(
  extendsModelSpreadString.get,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsDifferentSpreadString_put = passOnSuccess(
  extendsModelSpreadString.put,
);

// **************************************************** extends from a model has spread Record<float32> ****************************************************
const extendsModelSpreadFloatBody = {
  name: "abc",
  prop: 43.125,
  derivedProp: 43.125,
};
const extendsModelSpreadFloat = createMockApis(
  "extendsDifferentSpreadFloat",
  extendsModelSpreadFloatBody,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsDifferentSpreadFloat_get = passOnSuccess(
  extendsModelSpreadFloat.get,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsDifferentSpreadFloat_put = passOnSuccess(
  extendsModelSpreadFloat.put,
);

// **************************************************** extends from a model has spread Record<Model> ****************************************************
const extendsModelSpreadModelBody = {
  knownProp: "abc",
  prop: { state: "ok" },
  derivedProp: { state: "ok" },
};
const extendsModelSpreadModel = createMockApis(
  "extendsDifferentSpreadModel",
  extendsModelSpreadModelBody,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsDifferentSpreadModel_get = passOnSuccess(
  extendsModelSpreadModel.get,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsDifferentSpreadModel_put = passOnSuccess(
  extendsModelSpreadModel.put,
);

// **************************************************** extends from a model has spread Record<Model[]> ****************************************************
const extendsModelSpreadModelArrayBody = {
  knownProp: "abc",
  prop: [{ state: "ok" }, { state: "ok" }],
  derivedProp: [{ state: "ok" }, { state: "ok" }],
};
const extendsModelSpreadModelArray = createMockApis(
  "extendsDifferentSpreadModelArray",
  extendsModelSpreadModelArrayBody,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsDifferentSpreadModelArray_get = passOnSuccess(
  extendsModelSpreadModelArray.get,
);
Scenarios.Type_Property_AdditionalProperties_ExtendsDifferentSpreadModelArray_put = passOnSuccess(
  extendsModelSpreadModelArray.put,
);

// **************************************************** Multiple spread of Records ****************************************************
const multipleSpreadBody = {
  flag: true,
  prop1: "abc",
  prop2: 43.125,
};
const multipleSpreadRecord = createMockApis("multipleSpreadRecord", multipleSpreadBody);
Scenarios.Type_Property_AdditionalProperties_MultipleSpread_get = passOnSuccess(
  multipleSpreadRecord.get,
);
Scenarios.Type_Property_AdditionalProperties_MultipleSpread_put = passOnSuccess(
  multipleSpreadRecord.put,
);

// **************************************************** Record of union ****************************************************
const recordUnionBody = multipleSpreadBody;
const recordUnion = createMockApis("spreadRecordUnion", recordUnionBody);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordUnion_get = passOnSuccess(recordUnion.get);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordUnion_put = passOnSuccess(recordUnion.put);

// **************************************************** Record of discriminated union ****************************************************
const recordDiscriminatedUnionBody = {
  name: "abc",
  prop1: {
    kind: "kind0",
    fooProp: "abc",
  },
  prop2: {
    kind: "kind1",
    start: "2021-01-01T00:00:00Z",
    end: "2021-01-02T00:00:00Z",
  },
};

const recordDiscriminatedUnion = createMockApis(
  "spreadRecordDiscriminatedUnion",
  recordDiscriminatedUnionBody,
);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordDiscriminatedUnion_get = passOnSuccess(
  recordDiscriminatedUnion.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordDiscriminatedUnion_put = passOnSuccess(
  recordDiscriminatedUnion.put,
);

// **************************************************** Record of non discriminated union ****************************************************
const recordNonDiscriminatedUnion = createMockApis(
  "spreadRecordNonDiscriminatedUnion",
  recordDiscriminatedUnionBody,
);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion_get = passOnSuccess(
  recordNonDiscriminatedUnion.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion_put = passOnSuccess(
  recordNonDiscriminatedUnion.put,
);

// **************************************************** Record of non discriminated union 2 ****************************************************
const recordNonDiscriminatedUnion2Body = {
  name: "abc",
  prop1: {
    kind: "kind1",
    start: "2021-01-01T00:00:00Z",
  },
  prop2: {
    kind: "kind1",
    start: "2021-01-01T00:00:00Z",
    end: "2021-01-02T00:00:00Z",
  },
};
const recordNonDiscriminatedUnion2 = createMockApis(
  "spreadRecordNonDiscriminatedUnion2",
  recordNonDiscriminatedUnion2Body,
);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion2_get = passOnSuccess(
  recordNonDiscriminatedUnion2.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion2_put = passOnSuccess(
  recordNonDiscriminatedUnion2.put,
);

// **************************************************** Record of non discriminated union 3 ****************************************************
const recordNonDiscriminatedUnion3Body = {
  name: "abc",
  prop1: [
    {
      kind: "kind1",
      start: "2021-01-01T00:00:00Z",
    },
    {
      kind: "kind1",
      start: "2021-01-01T00:00:00Z",
    },
  ],
  prop2: {
    kind: "kind1",
    start: "2021-01-01T00:00:00Z",
    end: "2021-01-02T00:00:00Z",
  },
};
const recordNonDiscriminatedUnion3 = createMockApis(
  "spreadRecordNonDiscriminatedUnion3",
  recordNonDiscriminatedUnion3Body,
);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion3_get = passOnSuccess(
  recordNonDiscriminatedUnion3.get,
);
Scenarios.Type_Property_AdditionalProperties_SpreadRecordNonDiscriminatedUnion3_put = passOnSuccess(
  recordNonDiscriminatedUnion3.put,
);

function createServerTests(url: string, value: any, patchNullableProperty?: any) {
  return passOnSuccess({
    uri: url,
    mockMethods: [
      {
        method: `get`,
        request: {},
        response: {
          status: 200,
          data: value,
        },
      },
      {
        method: `put`,
        request: {
          body: value,
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Type_Property_Additional_Properties_Extends_Record_Unknown = createServerTests(
  `/type/property/additionalProperties/extendsRecordUnknown`,
  {
    name: "ExtendsUnknownAdditionalProperties",
    prop1: 32,
    prop2: true,
    prop3: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Extends_Record_Unknown_Derived = createServerTests(
  `/type/property/additionalProperties/extendsRecordUnknownDerived`,
  {
    name: "ExtendsUnknownAdditionalProperties",
    index: 314,
    age: 2.71875,
    prop1: 32,
    prop2: true,
    prop3: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Extends_Unknown_Discriminated = createServerTests(
  `/type/property/additionalProperties/extendsUnknownDiscriminated`,
  {
    kind: "derived",
    name: "Derived",
    index: 314,
    age: 2.71875,
    prop1: 32,
    prop2: true,
    prop3: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Is_Record_Unknown = createServerTests(
  `/type/property/additionalProperties/isRecordUnknown`,
  {
    name: "IsUnknownAdditionalProperties",
    prop1: 32,
    prop2: true,
    prop3: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Is_Record_Unknown_Derived = createServerTests(
  `/type/property/additionalProperties/isRecordUnknownDerived`,
  {
    name: "IsUnknownAdditionalProperties",
    index: 314,
    age: 2.71875,
    prop1: 32,
    prop2: true,
    prop3: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Is_Unknown_Discriminated = createServerTests(
  `/type/property/additionalProperties/isUnknownDiscriminated`,
  {
    kind: "derived",
    name: "Derived",
    index: 314,
    age: 2.71875,
    prop1: 32,
    prop2: true,
    prop3: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Extends_Record_String = createServerTests(
  `/type/property/additionalProperties/extendsRecordString`,
  {
    name: "ExtendsStringAdditionalProperties",
    prop: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Is_Record_String = createServerTests(
  `/type/property/additionalProperties/isRecordstring`,
  {
    name: "IsStringAdditionalProperties",
    prop: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Extends_Record_Float = createServerTests(
  `/type/property/additionalProperties/extendsRecordFloat`,
  recordFloatBody,
);

Scenarios.Type_Property_Additional_Properties_Is_Record_Float = createServerTests(
  `/type/property/additionalProperties/isRecordFloat`,
  recordFloatBody,
);

Scenarios.Type_Property_Additional_Properties_Extends_Record_Model = createServerTests(
  `/type/property/additionalProperties/extendsRecordModel`,
  recordModelBody,
);

Scenarios.Type_Property_Additional_Properties_Is_Record_Model = createServerTests(
  `/type/property/additionalProperties/isRecordModel`,
  recordModelBody,
);

Scenarios.Type_Property_Additional_Properties_Extends_Record_Model_Array = createServerTests(
  `/type/property/additionalProperties/extendsRecordModelArray`,
  recordModelArrayBody,
);

Scenarios.Type_Property_Additional_Properties_Is_Record_Model_Array = createServerTests(
  `/type/property/additionalProperties/isRecordModelArray`,
  recordModelArrayBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Record_String = createServerTests(
  `/type/property/additionalProperties/spreadRecordString`,
  {
    name: "SpreadSpringRecord",
    prop: "abc",
  },
);

Scenarios.Type_Property_Additional_Properties_Spread_Record_Float = createServerTests(
  `/type/property/additionalProperties/spreadRecordFloat`,
  recordFloatBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Record_Model = createServerTests(
  `/type/property/additionalProperties/spreadRecordModel`,
  recordModelBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Record_Model_Array = createServerTests(
  `/type/property/additionalProperties/spreadRecordModelArray`,
  recordModelArrayBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Different_Record_String = createServerTests(
  `/type/property/additionalProperties/spreadDifferentRecordString`,
  differentRecordStringBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Different_Record_Float = createServerTests(
  `/type/property/additionalProperties/spreadDifferentRecordFloat`,
  differentRecordFloatBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Different_Record_Model = createServerTests(
  `/type/property/additionalProperties/spreadDifferentRecordModel`,
  differentRecordModelBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Different_Record_Model_Array =
  createServerTests(
    `/type/property/additionalProperties/spreadDifferentRecordModelArray`,
    differentRecordModelArrayBody,
  );

Scenarios.Type_Property_Additional_Properties_Extends_Different_Spread_String = createServerTests(
  `/type/property/additionalProperties/extendsDifferentSpreadString`,
  extendsModelSpreadStringBody,
);

Scenarios.Type_Property_Additional_Properties_Extends_Different_Spread_Float = createServerTests(
  `/type/property/additionalProperties/extendsDifferentSpreadFloat`,
  extendsModelSpreadFloatBody,
);

Scenarios.Type_Property_Additional_Properties_Extends_Different_Spread_Model = createServerTests(
  `/type/property/additionalProperties/extendsDifferentSpreadModel`,
  extendsModelSpreadModelBody,
);

Scenarios.Type_Property_Additional_Properties_Extends_Different_Spread_Model_Array =
  createServerTests(
    `/type/property/additionalProperties/extendsDifferentSpreadModelArray`,
    extendsModelSpreadModelArrayBody,
  );

Scenarios.Type_Property_Additional_Properties_Multiple_Spread_Record = createServerTests(
  `/type/property/additionalProperties/multipleSpreadRecord`,
  multipleSpreadBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Record_Union = createServerTests(
  `/type/property/additionalProperties/spreadRecordUnion`,
  recordUnionBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Record_Discriminated_Union = createServerTests(
  `/type/property/additionalProperties/spreadRecordDiscriminatedUnion`,
  recordDiscriminatedUnionBody,
);

Scenarios.Type_Property_Additional_Properties_Spread_Record_Non_Discriminated_Union =
  createServerTests(
    `/type/property/additionalProperties/spreadRecordNonDiscriminatedUnion`,
    recordDiscriminatedUnionBody,
  );

Scenarios.Type_Property_Additional_Properties_Spread_Record_Non_Discriminated_Union2 =
  createServerTests(
    `/type/property/additionalProperties/spreadRecordNonDiscriminatedUnion2`,
    recordNonDiscriminatedUnion2Body,
  );

Scenarios.Type_Property_Additional_Properties_Spread_Record_Non_Discriminated_Union3 =
  createServerTests(
    `/type/property/additionalProperties/spreadRecordNonDiscriminatedUnion3`,
    recordNonDiscriminatedUnion3Body,
  );

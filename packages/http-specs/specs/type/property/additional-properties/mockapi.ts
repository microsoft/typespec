import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const recordFloatBody = {
  id: 43.125,
  prop: 43.125,
};
const recordModelBody = {
  knownProp: { state: "ok" },
  prop: { state: "ok" },
};
const recordModelArrayBody = {
  knownProp: [{ state: "ok" }, { state: "ok" }],
  prop: [{ state: "ok" }, { state: "ok" }],
};
const differentRecordStringBody = {
  id: 43.125,
  prop: "abc",
};
const differentRecordFloatBody = {
  name: "abc",
  prop: 43.125,
};
const differentRecordModelBody = {
  knownProp: "abc",
  prop: { state: "ok" },
};
const differentRecordModelArrayBody = {
  knownProp: "abc",
  prop: [{ state: "ok" }, { state: "ok" }],
};
const extendsModelSpreadStringBody = {
  id: 43.125,
  prop: "abc",
  derivedProp: "abc",
};
const extendsModelSpreadFloatBody = {
  name: "abc",
  prop: 43.125,
  derivedProp: 43.125,
};
const extendsModelSpreadModelBody = {
  knownProp: "abc",
  prop: { state: "ok" },
  derivedProp: { state: "ok" },
};
const extendsModelSpreadModelArrayBody = {
  knownProp: "abc",
  prop: [{ state: "ok" }, { state: "ok" }],
  derivedProp: [{ state: "ok" }, { state: "ok" }],
};
const multipleSpreadBody = {
  flag: true,
  prop1: "abc",
  prop2: 43.125,
};
const recordUnionBody = multipleSpreadBody;
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
function createServerTests(url: string, value: any) {
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
        handler: (req: MockRequest) => {
          return {
            status: 200,
            body: json(value),
          };
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
        handler: (req: MockRequest) => {
          const expectedBody = JSON.parse(JSON.stringify(value));
          req.expect.coercedBodyEquals(expectedBody);
          return {
            status: 204,
          };
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

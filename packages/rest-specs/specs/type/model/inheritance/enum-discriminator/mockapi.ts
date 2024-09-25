import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validExtensibleEnumBody = {
  weight: 10,
  kind: "golden",
};
Scenarios.Type_Model_Inheritance_EnumDiscriminator_getExtensibleModel = passOnSuccess(
  mockapi.get("/type/model/inheritance/enum-discriminator/extensible-enum", (req) => {
    return { status: 200, body: json(validExtensibleEnumBody) };
  }),
);

Scenarios.Type_Model_Inheritance_EnumDiscriminator_putExtensibleModel = passOnSuccess(
  mockapi.put("/type/model/inheritance/enum-discriminator/extensible-enum", (req) => {
    req.expect.bodyEquals(validExtensibleEnumBody);
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Inheritance_EnumDiscriminator_getExtensibleModelMissingDiscriminator =
  passOnSuccess(
    mockapi.get(
      "/type/model/inheritance/enum-discriminator/extensible-enum/missingdiscriminator",
      (req) => {
        return { status: 200, body: json({ weight: 10 }) };
      },
    ),
  );

Scenarios.Type_Model_Inheritance_EnumDiscriminator_getExtensibleModelWrongDiscriminator =
  passOnSuccess(
    mockapi.get(
      "/type/model/inheritance/enum-discriminator/extensible-enum/wrongdiscriminator",
      (req) => {
        return { status: 200, body: json({ weight: 8, kind: "wrongKind" }) };
      },
    ),
  );

const validFixedEnumBody = {
  length: 10,
  kind: "cobra",
};
Scenarios.Type_Model_Inheritance_EnumDiscriminator_getFixedModel = passOnSuccess(
  mockapi.get("/type/model/inheritance/enum-discriminator/fixed-enum", (req) => {
    return { status: 200, body: json(validFixedEnumBody) };
  }),
);

Scenarios.Type_Model_Inheritance_EnumDiscriminator_putFixedModel = passOnSuccess(
  mockapi.put("/type/model/inheritance/enum-discriminator/fixed-enum", (req) => {
    req.expect.bodyEquals(validFixedEnumBody);
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Inheritance_EnumDiscriminator_getFixedModelMissingDiscriminator =
  passOnSuccess(
    mockapi.get(
      "/type/model/inheritance/enum-discriminator/fixed-enum/missingdiscriminator",
      (req) => {
        return { status: 200, body: json({ length: 10 }) };
      },
    ),
  );

Scenarios.Type_Model_Inheritance_EnumDiscriminator_getFixedModelWrongDiscriminator = passOnSuccess(
  mockapi.get("/type/model/inheritance/enum-discriminator/fixed-enum/wrongdiscriminator", (req) => {
    return { status: 200, body: json({ length: 8, kind: "wrongKind" }) };
  }),
);

function createGetServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri: uri,
    mockMethods: [
      {
        method: "get",
        request: {},
        response: {
          status: 200,
          data: data,
        },
      },
    ],
  });
}

function createGetPutServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri: uri,
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

Scenarios.Type_Model_Inheritance_Enum_Discriminator_Extensible_Enum = createGetPutServerTests(
  "/type/model/inheritance/enum-discriminator/extensible-enum",
  validExtensibleEnumBody,
);
Scenarios.Type_Model_Inheritance_Enum_Discriminator_Fixed_Enum = createGetPutServerTests(
  "/type/model/inheritance/enum-discriminator/fixed-enum",
  validFixedEnumBody,
);
Scenarios.Type_Model_Inheritance_Enum_Discriminator_Extensible_Enum_Missing_Discriminator =
  createGetServerTests(
    "/type/model/inheritance/enum-discriminator/extensible-enum/missingdiscriminator",
    { weight: 10 },
  );
Scenarios.Type_Model_Inheritance_Enum_Discriminator_Extensible_Enum_Wrong_Discriminator =
  createGetServerTests(
    "/type/model/inheritance/enum-discriminator/extensible-enum/wrongdiscriminator",
    { weight: 8, kind: "wrongKind" },
  );
Scenarios.Type_Model_Inheritance_Enum_Discriminator_Fixed_Enum_Missing_Discriminator =
  createGetServerTests(
    "/type/model/inheritance/enum-discriminator/fixed-enum/missingdiscriminator",
    { length: 10 },
  );
Scenarios.Type_Model_Inheritance_Enum_Discriminator_Fixed_Enum_Wrong_Discriminator =
  createGetServerTests("/type/model/inheritance/enum-discriminator/fixed-enum/wrongdiscriminator", {
    length: 8,
    kind: "wrongKind",
  });

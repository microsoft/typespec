import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validExtensibleEnumBody = {
  weight: 10,
  kind: "golden",
};
const validFixedEnumBody = {
  length: 10,
  kind: "cobra",
};
function createGetServerTests(uri: string, data: any) {
  return passOnSuccess({
    uri: uri,
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json(data),
    },
    kind: "MockApiDefinition",
  });
}

function createGetPutServerTests(uri: string, data: any) {
  return {
    get: passOnSuccess({
      uri: uri,
      method: "get",
      request: {},
      response: {
        status: 200,
        body: json(data),
      },
      kind: "MockApiDefinition",
    }),
    put: passOnSuccess({
      uri: uri,
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

const Type_Model_Inheritance_Enum_Discriminator_Extensible_Enum = createGetPutServerTests(
  "/type/model/inheritance/enum-discriminator/extensible-enum",
  validExtensibleEnumBody,
);
Scenarios.Type_Model_Inheritance_EnumDiscriminator_getExtensibleModel =
  Type_Model_Inheritance_Enum_Discriminator_Extensible_Enum.get;
Scenarios.Type_Model_Inheritance_EnumDiscriminator_putExtensibleModel =
  Type_Model_Inheritance_Enum_Discriminator_Extensible_Enum.put;

const Type_Model_Inheritance_Enum_Discriminator_Fixed_Enum = createGetPutServerTests(
  "/type/model/inheritance/enum-discriminator/fixed-enum",
  validFixedEnumBody,
);
Scenarios.Type_Model_Inheritance_EnumDiscriminator_getFixedModel =
  Type_Model_Inheritance_Enum_Discriminator_Fixed_Enum.get;
Scenarios.Type_Model_Inheritance_EnumDiscriminator_putFixedModel =
  Type_Model_Inheritance_Enum_Discriminator_Fixed_Enum.put;

Scenarios.Type_Model_Inheritance_EnumDiscriminator_getExtensibleModelMissingDiscriminator =
  createGetServerTests(
    "/type/model/inheritance/enum-discriminator/extensible-enum/missingdiscriminator",
    { weight: 10 },
  );
Scenarios.Type_Model_Inheritance_EnumDiscriminator_getExtensibleModelWrongDiscriminator =
  createGetServerTests(
    "/type/model/inheritance/enum-discriminator/extensible-enum/wrongdiscriminator",
    { weight: 8, kind: "wrongKind" },
  );
Scenarios.Type_Model_Inheritance_EnumDiscriminator_getFixedModelMissingDiscriminator =
  createGetServerTests(
    "/type/model/inheritance/enum-discriminator/fixed-enum/missingdiscriminator",
    { length: 10 },
  );
Scenarios.Type_Model_Inheritance_EnumDiscriminator_getFixedModelWrongDiscriminator =
  createGetServerTests("/type/model/inheritance/enum-discriminator/fixed-enum/wrongdiscriminator", {
    length: 8,
    kind: "wrongKind",
  });

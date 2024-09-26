import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

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
    mockMethods: [
      {
        method: "get",
        request: {},
        response: {
          status: 200,
          data: data,
        },
        handler: (req: MockRequest) => {
          return { status: 200, body: json(data) };
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
        handler: (req: MockRequest) => {
          return { status: 200, body: json(data) };
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
          req.expect.bodyEquals(data);
          return { status: 204 };
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

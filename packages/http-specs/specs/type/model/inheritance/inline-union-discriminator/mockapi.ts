import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validPetBody = {
  kind: "cat",
  name: "Fluffy",
  meow: true,
};

Scenarios.Type_Model_Inheritance_InlineUnionDiscriminator_get = passOnSuccess({
  uri: "/type/model/inheritance/inline-union-discriminator/model",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(validPetBody),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Inheritance_InlineUnionDiscriminator_put = passOnSuccess({
  uri: "/type/model/inheritance/inline-union-discriminator/model",
  method: "put",
  request: {
    body: json(validPetBody),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Inheritance_InlineUnionDiscriminator_getMissingDiscriminator = passOnSuccess({
  uri: "/type/model/inheritance/inline-union-discriminator/missingdiscriminator",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({ name: "Fluffy", meow: true }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Inheritance_InlineUnionDiscriminator_getWrongDiscriminator = passOnSuccess({
  uri: "/type/model/inheritance/inline-union-discriminator/wrongdiscriminator",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({ kind: "bird", name: "Tweety" }),
  },
  kind: "MockApiDefinition",
});
import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validPolymorphicBody = {
  wingspan: 1,
  kind: "sparrow",
};
const validRecursiveBody = {
  wingspan: 5,
  kind: "eagle",
  partner: {
    wingspan: 2,
    kind: "goose",
  },
  friends: [
    {
      wingspan: 2,
      kind: "seagull",
    },
  ],
  hate: {
    key3: {
      wingspan: 1,
      kind: "sparrow",
    },
  },
};
Scenarios.Type_Model_Inheritance_SingleDiscriminator_getModel = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/model",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(validPolymorphicBody),
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_SingleDiscriminator_putModel = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/model",
  method: "put",
  request: {
    body: json(validPolymorphicBody),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Inheritance_SingleDiscriminator_getRecursiveModel = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/recursivemodel",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(validRecursiveBody),
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_SingleDiscriminator_putRecursiveModel = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/recursivemodel",
  method: "put",
  request: {
    body: json(validRecursiveBody),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Inheritance_SingleDiscriminator_getMissingDiscriminator = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/missingdiscriminator",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({ wingspan: 1 }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Inheritance_SingleDiscriminator_getWrongDiscriminator = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/wrongdiscriminator",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({ wingspan: 1, kind: "wrongKind" }),
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_SingleDiscriminator_getLegacyModel = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/legacy-model",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({ size: 20, kind: "t-rex" }),
  },
  kind: "MockApiDefinition",
});

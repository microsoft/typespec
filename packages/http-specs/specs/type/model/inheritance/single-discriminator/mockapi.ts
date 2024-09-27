import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

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
Scenarios.Type_Model_Inheritance_Single_Discriminator_Model = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/model",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        body: json(validPolymorphicBody),
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json(validPolymorphicBody) };
      },
    },
    {
      method: "put",
      request: {
        body: validPolymorphicBody,
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(validPolymorphicBody);
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_Single_Discriminator_Recursive_Model = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/recursivemodel",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        body: json(validRecursiveBody),
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json(validRecursiveBody) };
      },
    },
    {
      method: "put",
      request: {
        body: validRecursiveBody,
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(validRecursiveBody);
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_Single_Discriminator_Missing_Discriminator = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/missingdiscriminator",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        body: json({ wingspan: 1 }),
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json({ wingspan: 1 }) };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_Single_Discriminator_Wrong_Discriminator = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/wrongdiscriminator",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        body: json({ wingspan: 1, kind: "wrongKind" }),
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json({ wingspan: 1, kind: "wrongKind" }) };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_Single_Discriminator_Legacy_Model = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/legacy-model",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        body: json({ size: 20, kind: "t-rex" }),
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json({ size: 20, kind: "t-rex" }) };
      },
    },
  ],
  kind: "MockApiDefinition",
});

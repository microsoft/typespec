import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validPolymorphicBody = {
  wingspan: 1,
  kind: "sparrow",
};
Scenarios.Type_Model_Inheritance_SingleDiscriminator_getModel = passOnSuccess(
  mockapi.get("/type/model/inheritance/single-discriminator/model", (req) => {
    return { status: 200, body: json(validPolymorphicBody) };
  }),
);

Scenarios.Type_Model_Inheritance_SingleDiscriminator_putModel = passOnSuccess(
  mockapi.put("/type/model/inheritance/single-discriminator/model", (req) => {
    req.expect.bodyEquals(validPolymorphicBody);
    return { status: 204 };
  }),
);

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
Scenarios.Type_Model_Inheritance_SingleDiscriminator_getRecursiveModel = passOnSuccess(
  mockapi.get("/type/model/inheritance/single-discriminator/recursivemodel", (req) => {
    return { status: 200, body: json(validRecursiveBody) };
  }),
);

Scenarios.Type_Model_Inheritance_SingleDiscriminator_putRecursiveModel = passOnSuccess(
  mockapi.put("/type/model/inheritance/single-discriminator/recursivemodel", (req) => {
    req.expect.bodyEquals(validRecursiveBody);
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Inheritance_SingleDiscriminator_getMissingDiscriminator = passOnSuccess(
  mockapi.get("/type/model/inheritance/single-discriminator/missingdiscriminator", (req) => {
    return { status: 200, body: json({ wingspan: 1 }) };
  }),
);

Scenarios.Type_Model_Inheritance_SingleDiscriminator_getWrongDiscriminator = passOnSuccess(
  mockapi.get("/type/model/inheritance/single-discriminator/wrongdiscriminator", (req) => {
    return { status: 200, body: json({ wingspan: 1, kind: "wrongKind" }) };
  }),
);

Scenarios.Type_Model_Inheritance_SingleDiscriminator_getLegacyModel = passOnSuccess(
  mockapi.get("/type/model/inheritance/single-discriminator/legacy-model", (req) => {
    return { status: 200, body: json({ size: 20, kind: "t-rex" }) };
  }),
);

Scenarios.Type_Model_Inheritance_Single_Discriminator_Model = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/model",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: validPolymorphicBody,
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
    },
  ],
});

Scenarios.Type_Model_Inheritance_Single_Discriminator_Recursive_Model = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/recursivemodel",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: validRecursiveBody,
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
    },
  ],
});

Scenarios.Type_Model_Inheritance_Single_Discriminator_Missing_Discriminator = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/missingdiscriminator",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: { wingspan: 1 },
      },
    },
  ],
});

Scenarios.Type_Model_Inheritance_Single_Discriminator_Wrong_Discriminator = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/wrongdiscriminator",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: { wingspan: 1, kind: "wrongKind" },
      },
    },
  ],
});

Scenarios.Type_Model_Inheritance_Single_Discriminator_Legacy_Model = passOnSuccess({
  uri: "/type/model/inheritance/single-discriminator/legacy-model",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: { size: 20, kind: "t-rex" },
      },
    },
  ],
});

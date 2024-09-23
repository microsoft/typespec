import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validPolymorphicBody = {
  age: 1,
  kind: "shark",
  sharktype: "goblin",
};
Scenarios.Type_Model_Inheritance_NestedDiscriminator_getModel = passOnSuccess(
  mockapi.get("/type/model/inheritance/nested-discriminator/model", (req) => {
    return { status: 200, body: json(validPolymorphicBody) };
  }),
);

Scenarios.Type_Model_Inheritance_NestedDiscriminator_putModel = passOnSuccess(
  mockapi.put("/type/model/inheritance/nested-discriminator/model", (req) => {
    req.expect.bodyEquals(validPolymorphicBody);
    return { status: 204 };
  }),
);

const validRecursiveBody = {
  age: 1,
  kind: "salmon",
  partner: {
    age: 2,
    kind: "shark",
    sharktype: "saw",
  },
  friends: [
    {
      age: 2,
      kind: "salmon",
      partner: {
        age: 3,
        kind: "salmon",
      },
      hate: {
        key1: {
          age: 4,
          kind: "salmon",
        },
        key2: {
          age: 2,
          kind: "shark",
          sharktype: "goblin",
        },
      },
    },
    {
      age: 3,
      kind: "shark",
      sharktype: "goblin",
    },
  ],
  hate: {
    key3: {
      age: 3,
      kind: "shark",
      sharktype: "saw",
    },
    key4: {
      age: 2,
      kind: "salmon",
      friends: [
        {
          age: 1,
          kind: "salmon",
        },
        {
          age: 4,
          kind: "shark",
          sharktype: "goblin",
        },
      ],
    },
  },
};
Scenarios.Type_Model_Inheritance_NestedDiscriminator_getRecursiveModel = passOnSuccess(
  mockapi.get("/type/model/inheritance/nested-discriminator/recursivemodel", (req) => {
    return { status: 200, body: json(validRecursiveBody) };
  }),
);

Scenarios.Type_Model_Inheritance_NestedDiscriminator_putRecursiveModel = passOnSuccess(
  mockapi.put("/type/model/inheritance/nested-discriminator/recursivemodel", (req) => {
    req.expect.bodyEquals(validRecursiveBody);
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Inheritance_NestedDiscriminator_getMissingDiscriminator = passOnSuccess(
  mockapi.get("/type/model/inheritance/nested-discriminator/missingdiscriminator", (req) => {
    return { status: 200, body: json({ age: 1 }) };
  }),
);

Scenarios.Type_Model_Inheritance_NestedDiscriminator_getWrongDiscriminator = passOnSuccess(
  mockapi.get("/type/model/inheritance/nested-discriminator/wrongdiscriminator", (req) => {
    return { status: 200, body: json({ age: 1, kind: "wrongKind" }) };
  }),
);

Scenarios.Type_Model_Inheritance_Nested_Discriminator_Model = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/model",
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

Scenarios.Type_Model_Inheritance_Nested_Discriminator_Recursive_Model = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/recursivemodel",
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

Scenarios.Type_Model_Inheritance_Nested_Discriminator_Missing_Discriminator = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/missingdiscriminator",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: { age: 1 },
      },
    },
  ],
});

Scenarios.Type_Model_Inheritance_Nested_Discriminator_Wrong_Discriminator = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/wrongdiscriminator",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: { age: 1, kind: "wrongKind" },
      },
    },
  ],
});

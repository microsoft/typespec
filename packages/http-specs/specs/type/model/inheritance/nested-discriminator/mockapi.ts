import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validPolymorphicBody = {
  age: 1,
  kind: "shark",
  sharktype: "goblin",
};
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
Scenarios.Type_Model_Inheritance_NestedDiscriminator_getModel = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/model",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(validPolymorphicBody),
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_NestedDiscriminator_putModel = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/model",
  method: "put",
  request: {
    body: json(validPolymorphicBody),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Inheritance_NestedDiscriminator_getRecursiveModel = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/recursivemodel",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(validRecursiveBody),
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_NestedDiscriminator_putRecursiveModel = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/recursivemodel",
  method: "put",
  request: {
    body: json(validRecursiveBody),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Inheritance_NestedDiscriminator_getMissingDiscriminator = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/missingdiscriminator",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({ age: 1 }),
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_NestedDiscriminator_getWrongDiscriminator = passOnSuccess({
  uri: "/type/model/inheritance/nested-discriminator/wrongdiscriminator",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({ age: 1, kind: "wrongKind" }),
  },
  kind: "MockApiDefinition",
});

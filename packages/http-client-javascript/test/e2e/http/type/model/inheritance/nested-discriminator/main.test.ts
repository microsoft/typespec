import { describe, expect, it } from "vitest";
import { NestedDiscriminatorClient } from "../../../../../generated/http/type/model/inheritance/nested-discriminator/http-client-javascript/src/index.js";

describe("Type.Model.Inheritance.NestedDiscriminator", () => {
  const client = new NestedDiscriminatorClient("http://localhost:3000", {
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 0,
    },
  });

  it("should get a polymorphic model with 2 discriminators", async () => {
    const response = await client.getModel();
    expect(response).toEqual({
      age: 1,
      kind: "shark",
      sharktype: "goblin",
    });
  });

  it("should send a polymorphic model with 2 discriminators", async () => {
    const input = {
      age: 1,
      kind: "shark",
      sharktype: "goblin",
    };
    await client.putModel(input);
    // Assert successful request
  });

  it("should get a recursive polymorphic model", async () => {
    const response = await client.getRecursiveModel();
    expect(response).toEqual({
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
    });
  });

  it("should send a recursive polymorphic model", async () => {
    const input = {
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
    await client.putRecursiveModel(input);
    // Assert successful request
  });

  it("should get a model omitting the discriminator", async () => {
    const response = await client.getMissingDiscriminator();
    expect(response).toEqual({
      age: 1,
    });
  });

  it("should get a model with a wrong discriminator value", async () => {
    const response = await client.getWrongDiscriminator();
    expect(response).toEqual({
      age: 1,
      kind: "wrongKind",
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  Eagle,
  SingleDiscriminatorClient,
} from "../../../../../generated/type/model/inheritance/single-discriminator/src/index.js";

describe("Type.Model.Inheritance.SingleDiscriminator", () => {
  const client = new SingleDiscriminatorClient({
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 0,
    },
  });

  it("should receive polymorphic model in single level inheritance with 1 discriminator", async () => {
    const response = await client.getModel();
    expect(response).toEqual({
      wingspan: 1,
      kind: "sparrow",
    });
  });

  it("should send polymorphic model in single level inheritance with 1 discriminator", async () => {
    await client.putModel({
      wingspan: 1,
      kind: "sparrow",
    });
    // Assert successful request
  });

  it("should receive polymorphic models with collection and dictionary properties referring to other polymorphic models", async () => {
    const response = await client.getRecursiveModel();
    expect(response).toEqual({
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
    });
  });

  it("should send polymorphic models with collection and dictionary properties referring to other polymorphic models", async () => {
    await client.putRecursiveModel({
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
    } as Eagle);
    // Assert successful request
  });

  it("should handle a model omitting the discriminator", async () => {
    const response = await client.getMissingDiscriminator();
    expect(response).toEqual({
      wingspan: 1,
    });
  });

  it("should handle a model containing a discriminator value that was never defined", async () => {
    const response = await client.getWrongDiscriminator();
    expect(response).toEqual({
      wingspan: 1,
      kind: "wrongKind",
    });
  });

  it("should receive polymorphic model defined in a legacy way", async () => {
    const response = await client.getLegacyModel();
    expect(response).toEqual({
      size: 20,
      kind: "t-rex",
    });
  });
});

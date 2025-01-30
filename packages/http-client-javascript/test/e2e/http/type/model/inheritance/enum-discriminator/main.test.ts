import { describe, expect, it } from "vitest";
import { EnumDiscriminatorClient } from "../../../../../generated/http/type/model/inheritance/enum-discriminator/http-client-javascript/src/index.js";

describe("Type.Model.Inheritance.EnumDiscriminator", () => {
  const client = new EnumDiscriminatorClient("http://localhost:3000", {
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 0,
    },
  });

  it("should receive model with extensible enum discriminator type", async () => {
    const response = await client.getExtensibleModel();
    expect(response).toEqual({ kind: "golden", weight: 10 }); // Mock API expected response
  });

  it("should send model with extensible enum discriminator type", async () => {
    await client.putExtensibleModel({ kind: "golden", weight: 10 });
    // Assert successful request
  });

  it("should get a model omitting the discriminator with extensible enum type", async () => {
    const response = await client.getExtensibleModelMissingDiscriminator();
    expect(response).toEqual({ weight: 10 }); // Mock API expected response
  });

  it("should get a model containing discriminator value never defined with extensible enum type", async () => {
    const response = await client.getExtensibleModelWrongDiscriminator();
    expect(response).toEqual({ kind: "wrongKind", weight: 8 }); // Mock API expected response
  });

  it("should receive model with fixed enum discriminator type", async () => {
    const response = await client.getFixedModel();
    expect(response).toEqual({ kind: "cobra", length: 10 }); // Mock API expected response
  });

  it("should send model with fixed enum discriminator type", async () => {
    await client.putFixedModel({ kind: "cobra", length: 10 });
    // Assert successful request
  });

  it("should get a model omitting the discriminator with fixed enum type", async () => {
    const response = await client.getFixedModelMissingDiscriminator();
    expect(response).toEqual({ length: 10 }); // Mock API expected response
  });

  it("should get a model containing discriminator value never defined with fixed enum type", async () => {
    const response = await client.getFixedModelWrongDiscriminator();
    expect(response).toEqual({ kind: "wrongKind", length: 8 }); // Mock API expected response
  });
});

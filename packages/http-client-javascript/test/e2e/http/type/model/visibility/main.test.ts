import { describe, expect, it } from "vitest";
import { TypeModelVisibilityClient } from "../../../../generated/http/type/model/visibility/http-client-javascript/src/index.js";

describe("Type.Model.Visibility", () => {
  const client = new TypeModelVisibilityClient("http://localhost:3000");

  it("should generate and receive an output model with readonly properties (getModel)", async () => {
    const input = {
      queryProp: 123,
    };
    const response = await client.getModel(input);
    expect(response.readProp).toBe("abc");
  });

  it("should send a model with write/create properties (headModel)", async () => {
    const input = {
      queryProp: 123,
    };
    const response = await client.headModel(input);
    expect(response).toBeDefined();
  });

  it("should send a model with write/create/update properties (putModel)", async () => {
    const input = {
      createProp: ["foo", "bar"],
      updateProp: [1, 2],
    };
    await client.putModel(input);
    // Assert successful request
  });

  it("should send a model with write/update properties (patchModel)", async () => {
    const input = {
      updateProp: [1, 2],
    };
    await client.patchModel(input);
    // Assert successful request
  });

  it("should send a model with write/create properties (postModel)", async () => {
    const input = {
      createProp: ["foo", "bar"],
    };
    await client.postModel(input);
    // Assert successful request
  });

  it("should send a model with write/delete properties (deleteModel)", async () => {
    const input = {
      deleteProp: true,
    };
    await client.deleteModel(input);
    // Assert successful request
  });

  it("should send and receive a model with readonly properties (putReadOnlyModel)", async () => {
    const input = {};
    const response = await client.putReadOnlyModel(input);
    expect(response.optionalNullableIntList).toEqual([1, 2, 3]);
    expect(response.optionalStringRecord).toEqual({
      k1: "value1",
      k2: "value2",
    });
  });
});

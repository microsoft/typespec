import { describe, expect, it } from "vitest";
import { VisibilityClient } from "../../../../generated/type/model/visibility/src/index.js";

describe("Type.Model.Visibility", () => {
  const client = new VisibilityClient({ allowInsecureConnection: true });

  it("should generate and receive an output model with readonly properties (getModel)", async () => {
    const input = {
      queryProp: 123,
    };
    const response = await client.getModel(input as any);
    expect(response.readProp).toBe("abc");
  });

  it("should send a model with write/create properties (headModel)", async () => {
    const input = {
      queryProp: 123,
    };
    await client.headModel(input as any);
  });

  it("should send a model with write/create/update properties (putModel)", async () => {
    const input = {
      createProp: ["foo", "bar"],
      updateProp: [1, 2],
    };
    await client.putModel(input as any);
    // Assert successful request
  });

  it("should send a model with write/update properties (patchModel)", async () => {
    const input = {
      updateProp: [1, 2],
    };
    await client.patchModel(input as any);
    // Assert successful request
  });

  it("should send a model with write/create properties (postModel)", async () => {
    const input = {
      createProp: ["foo", "bar"],
    };
    await client.postModel(input as any);
    // Assert successful request
  });

  it("should send a model with write/delete properties (deleteModel)", async () => {
    const input = {
      deleteProp: true,
    };
    await client.deleteModel(input as any);
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

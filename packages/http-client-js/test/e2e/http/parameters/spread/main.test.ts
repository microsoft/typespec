import { describe, it } from "vitest";
import { AliasClient, ModelClient } from "../../../generated/parameters/spread/src/index.js";

describe("Parameters.Spread", () => {
  describe("ModelClient", () => {
    const client = new ModelClient({ allowInsecureConnection: true });

    it("should handle spread named model in request body", async () => {
      await client.spreadAsRequestBody("foo");
    });

    it("should handle spread model with only @body property", async () => {
      await client.spreadCompositeRequestOnlyWithBody({ name: "foo" });
    });

    it("should handle spread model without @body property", async () => {
      await client.spreadCompositeRequestWithoutBody("foo", "bar");
    });

    it("should handle spread model with all HTTP request decorators", async () => {
      await client.spreadCompositeRequest("foo", "bar", { name: "foo" });
    });

    it("should handle spread model with non-body HTTP request decorators", async () => {
      await client.spreadCompositeRequestMix("foo", "bar", "foo");
    });
  });

  describe("AliasClient", () => {
    const client = new AliasClient({ allowInsecureConnection: true });

    it("should handle spread alias in request body", async () => {
      await client.spreadAsRequestBody("foo");
    });

    it("should handle spread alias with inner model in parameters", async () => {
      await client.spreadParameterWithInnerModel("1", "foo", "bar");
    });

    it("should handle spread alias with path and header parameters", async () => {
      await client.spreadAsRequestParameter("1", "bar", "foo");
    });

    it("should handle spread alias including multiple parameters, optional and required", async () => {
      // Required parameters are positional and optional parameters are within the options bag
      await client.spreadWithMultipleParameters("1", "bar", "foo", [1, 2], {
        optionalInt: 1,
        optionalStringList: ["foo", "bar"],
      });
    });

    it("should handle spread alias containing another alias property as body", async () => {
      await client.spreadParameterWithInnerAlias("1", "foo", 1, "bar");
    });
  });
});

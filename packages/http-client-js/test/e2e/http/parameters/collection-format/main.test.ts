import { describe, it } from "vitest";
import {
  HeaderClient,
  QueryClient,
} from "../../../generated/parameters/collection-format/src/index.js";

describe("Parameters.CollectionFormat", () => {
  describe("QueryClient", () => {
    const client = new QueryClient({ allowInsecureConnection: true });

    it("should test sending a multi collection format array query parameters", async () => {
      await client.multi(["blue", "red", "green"]);
      // Assert successful request
    });

    it.skip("should test sending an ssv collection format array query parameters", async () => {
      await client.ssv(["blue", "red", "green"]);
      // Assert successful request
    });

    it.skip("should test sending a pipes collection format array query parameters", async () => {
      await client.pipes(["blue", "red", "green"]);
      // Assert successful request
    });

    it("should test sending a csv collection format array query parameters", async () => {
      await client.csv(["blue", "red", "green"]);
      // Assert successful request
    });
  });

  describe("HeaderClient", () => {
    const client = new HeaderClient({ allowInsecureConnection: true });

    it("should test sending a csv collection format array header parameters", async () => {
      await client.csv(["blue", "red", "green"]);
      // Assert successful request
    });
  });
});

import { describe, it } from "vitest";
import {
  HeaderClient,
  QueryClient,
} from "../../../generated/http/parameters/collection-format/http-client-javascript/src/index.js";

describe("Parameters.CollectionFormat", () => {
  describe("QueryClient", () => {
    const client = new QueryClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should test sending a multi collection format array query parameters", async () => {
      await client.multi(["blue", "red", "green"]);
      // Assert successful request
    });

    it("should test sending an ssv collection format array query parameters", async () => {
      await client.ssv(["blue", "red", "green"]);
      // Assert successful request
    });

    it("should test sending a tsv collection format array query parameters", async () => {
      await client.tsv(["blue", "red", "green"]);
      // Assert successful request
    });

    it("should test sending a pipes collection format array query parameters", async () => {
      await client.pipes(["blue", "red", "green"]);
      // Assert successful request
    });

    it("should test sending a csv collection format array query parameters", async () => {
      await client.csv(["blue", "red", "green"]);
      // Assert successful request
    });
  });

  describe("HeaderClient", () => {
    const client = new HeaderClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should test sending a csv collection format array header parameters", async () => {
      await client.csv(["blue", "red", "green"]);
      // Assert successful request
    });
  });
});

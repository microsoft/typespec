import { describe, it } from "vitest";
import {
  ExplicitBodyClient,
  ImplicitBodyClient,
} from "../../../generated/http/parameters/basic/http-client-javascript/src/index.js";

describe("Parameters.Basic", () => {
  describe("ExplicitBodyClient", () => {
    const client = new ExplicitBodyClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a simple explicit body", async () => {
      await client.simple({ name: "foo" });
      // Assert successful request
    });
  });

  describe("ImplicitBodyClient", () => {
    const client = new ImplicitBodyClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle a simple implicit body", async () => {
      await client.simple("foo");
      // Assert successful request
    });
  });
});

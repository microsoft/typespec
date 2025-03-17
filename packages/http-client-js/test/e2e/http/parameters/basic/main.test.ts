import { describe, it } from "vitest";
import {
  ExplicitBodyClient,
  ImplicitBodyClient,
} from "../../../generated/parameters/basic/src/index.js";

describe("Parameters.Basic", () => {
  describe("ExplicitBodyClient", () => {
    const client = new ExplicitBodyClient({
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
    const client = new ImplicitBodyClient({
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

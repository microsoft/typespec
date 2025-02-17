import { describe, it } from "vitest";
import {
  BodyOptionalityClient,
  OptionalExplicitClient,
} from "../../../generated/parameters/body-optionality/src/index.js";

describe("Parameters.BodyOptionality", () => {
  const client = new BodyOptionalityClient({
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 1,
    },
  });

  it("should handle required explicit body parameter", async () => {
    await client.requiredExplicit({ name: "foo" });
    // Assert successful request
  });

  describe("OptionalExplicitClient", () => {
    const optionalExplicitClient = new OptionalExplicitClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle explicit optional body parameter (set case)", async () => {
      await optionalExplicitClient.set({ body: { name: "foo" } });
      // Assert successful request
    });

    it("should handle explicit optional body parameter (omit case)", async () => {
      await optionalExplicitClient.omit();
      // Assert successful request
    });
  });

  it("should handle implicit required body parameter", async () => {
    await client.requiredImplicit("foo");
    // Assert successful request
  });
});

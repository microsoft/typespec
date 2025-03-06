import { describe, expect, it } from "vitest";
import { StringBodyClient } from "../../../generated/payload/media-type/src/index.js";

describe("Payload.MediaType", () => {
  describe("StringBodyClient", () => {
    const client = new StringBodyClient({ allowInsecureConnection: true });

    it.skip("should send a string body as text/plain", async () => {
      await client.sendAsText("cat");
      // Assert successful request
    });

    it.skip("should get a string body as text/plain", async () => {
      const response = await client.getAsText();
      expect(response).toBe("cat"); // Mock API expected value
    });

    it("should send a string body as application/json", async () => {
      await client.sendAsJson("foo");
      // Assert successful request
    });

    it("should get a string body as application/json", async () => {
      const response = await client.getAsJson();
      expect(response).toBe("foo"); // Mock API expected value
    });
  });
});

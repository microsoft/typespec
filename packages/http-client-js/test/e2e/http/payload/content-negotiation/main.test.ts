import { describe, expect, it } from "vitest";
import {
  DifferentBodyClient,
  SameBodyClient,
} from "../../../generated/payload/content-negotiation/src/index.js";

describe("Payload.ContentNegotiation", () => {
  describe("SameBodyClient", () => {
    const client = new SameBodyClient({ allowInsecureConnection: true });

    it.skip("should return a PNG image when 'Accept: image/png' is sent", async () => {
      const response = await client.getAvatarAsPng();
      expect(response).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });

    it.skip("should return a JPEG image when 'Accept: image/jpeg' is sent", async () => {
      const response = await client.getAvatarAsJpeg();
      expect(response).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });
  });

  describe("DifferentBodyClient", () => {
    const client = new DifferentBodyClient({
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it.skip("should return a PNG image when 'Accept: image/png' is sent", async () => {
      const response = await client.getAvatarAsPng();
      expect(response).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });

    it.skip("should return a JSON object containing a PNG image when 'Accept: application/json' is sent", async () => {
      const response = await client.getAvatarAsJson();
      expect(response.content).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });
  });
});

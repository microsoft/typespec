import { describe, expect, it } from "vitest";
import {
  DifferentBodyClient,
  SameBodyClient,
} from "../../../generated/http/payload/content-negotiation/http-client-javascript/src/index.js";

describe("Payload.ContentNegotiation", () => {
  describe("SameBodyClient", () => {
    const client = new SameBodyClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should return a PNG image when 'Accept: image/png' is sent", async () => {
      const response = await client.getAvatarAsPng();
      expect(response).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });

    it("should return a JPEG image when 'Accept: image/jpeg' is sent", async () => {
      const response = await client.getAvatarAsJpeg();
      expect(response).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });
  });

  describe("DifferentBodyClient", () => {
    const client = new DifferentBodyClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should return a PNG image when 'Accept: image/png' is sent", async () => {
      const response = await client.getAvatarAsPng();
      expect(response).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });

    it("should return a JSON object containing a PNG image when 'Accept: application/json' is sent", async () => {
      const response = await client.getAvatarAsJson();
      expect(response.content).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });
  });
});

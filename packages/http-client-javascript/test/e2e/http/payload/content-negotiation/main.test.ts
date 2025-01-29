import { describe, expect, it } from "vitest";
import {
  SameBodyClient,
  DifferentBodyClient,
} from "../../../generated/http/payload/content-negotiation/http-client-javascript/src/index.js";

describe("Payload.ContentNegotiation", () => {
  describe("SameBodyClient", () => {
    const client = new SameBodyClient("http://localhost:3000");

    it("should return a PNG image when 'Accept: image/png' is sent", async () => {
      const response = await client.getAvatarAsPng("image/png");
      expect(response.contentType).toBe("image/png");
      expect(response.image).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });

    it("should return a JPEG image when 'Accept: image/jpeg' is sent", async () => {
      const response = await client.getAvatarAsJpeg("image/jpeg");
      expect(response.contentType).toBe("image/jpeg");
      expect(response.image).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });
  });

  describe("DifferentBodyClient", () => {
    const client = new DifferentBodyClient("http://localhost:3000");

    it("should return a PNG image when 'Accept: image/png' is sent", async () => {
      const response = await client.getAvatarAsPng("image/png");
      expect(response.contentType).toBe("image/png");
      expect(response.image).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });

    it("should return a JSON object containing a PNG image when 'Accept: application/json' is sent", async () => {
      const response = await client.getAvatarAsJson("application/json");
      expect(response.contentType).toBe("application/json");
      expect(response.content).toBeInstanceOf(Uint8Array); // Mock API expected binary result
    });
  });
});

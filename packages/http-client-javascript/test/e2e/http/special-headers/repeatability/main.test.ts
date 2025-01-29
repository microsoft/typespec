import { describe, it, expect } from "vitest";
import { SpecialHeadersRepeatabilityClient } from "../../../generated/http/special-headers/repeatability/http-client-javascript/src/index.js";

describe("SpecialHeaders.Repeatability", () => {
  const client = new SpecialHeadersRepeatabilityClient("http://localhost:3000");

  it("should recognize Repeatability-Request-ID and Repeatability-First-Sent headers", async () => {
    const repeatabilityRequestID = "123e4567-e89b-12d3-a456-426614174000";
    const repeatabilityFirstSent = new Date("2023-10-05T14:48:00.000Z");

    const response = await client.immediateSuccess(
      repeatabilityRequestID,
      repeatabilityFirstSent,
    );

    expect(response.statusCode).toBe(204);
    expect(response.repeatabilityResult).toBeDefined();
  });
});

import { describe, it } from "vitest";
import { RepeatabilityClient } from "../../../generated/http/special-headers/repeatability/http-client-javascript/src/index.js";

describe("SpecialHeaders.Repeatability", () => {
  const client = new RepeatabilityClient("http://localhost:3000", {
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 0,
    },
  });

  it("should recognize Repeatability-Request-ID and Repeatability-First-Sent headers", async () => {
    const repeatabilityRequestID = "123e4567-e89b-12d3-a456-426614174000";
    const repeatabilityFirstSent = new Date("2023-10-05T14:48:00.000Z");

    await client.immediateSuccess(repeatabilityRequestID, repeatabilityFirstSent);
  });
});

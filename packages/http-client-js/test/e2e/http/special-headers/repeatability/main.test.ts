import { describe, it } from "vitest";
import { RepeatabilityClient } from "../../../generated/special-headers/repeatability/src/index.js";

describe("SpecialHeaders.Repeatability", () => {
  const client = new RepeatabilityClient({
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 0,
    },
  });

  it("should recognize Repeatability-Request-ID and Repeatability-First-Sent headers", async () => {
    const repeatabilityRequestID = "2378d9bc-1726-11ee-be56-0242ac120002";
    const repeatabilityFirstSent = new Date("Tue, 15 Nov 2022 12:45:26 GMT");

    await client.immediateSuccess(repeatabilityRequestID, repeatabilityFirstSent);
  });
});

import { describe, it } from "vitest";
import { ConditionalRequestClient } from "../../../generated/special-headers/conditional-request/src/index.js";

describe("SpecialHeaders.ConditionalRequest", () => {
  const client = new ConditionalRequestClient({
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 0,
    },
  });

  // mockapi issue Double quotes
  it.skip("should send a request with If-Match header defined", async () => {
    await client.postIfMatch({ ifMatch: "valid" });
    // Assert successful request
  });

  // mockapi issue Double quotes
  it.skip("should send a request with If-None-Match header defined", async () => {
    await client.postIfNoneMatch({ ifNoneMatch: "invalid" });
    // Assert successful request
  });

  it("should send a request with If-Modified-Since header defined", async () => {
    const date = new Date("Fri, 26 Aug 2022 14:38:00 GMT");
    await client.headIfModifiedSince({ ifModifiedSince: date });
    // Assert successful request
  });

  it("should send a request with If-Unmodified-Since header defined", async () => {
    const date = new Date("Fri, 26 Aug 2022 14:38:00 GMT");
    await client.postIfUnmodifiedSince({ ifUnmodifiedSince: date });
    // Assert successful request
  });
});

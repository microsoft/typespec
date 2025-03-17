import { describe, it } from "vitest";
import { SingleClient } from "../../../../generated/server/path/single/src/index.js";

describe("Server.Path.Single", () => {
  const client = new SingleClient("http://localhost:3000", { allowInsecureConnection: true });

  it("should perform a simple operation in a parameterized server", async () => {
    await client.myOp();
    // Assert successful request
  });
});

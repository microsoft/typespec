import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runScenario } from "./spector.js";

describe("Parameters.Basic", () => {
  let serverAbortController: AbortController;
  beforeEach(() => {
    serverAbortController = new AbortController();
  });
  afterEach(() => {
    serverAbortController.abort();
  });

  it("passes all scenarios", async () => {
    // const baseUrl = await startServer(router, serverAbortController.signal);
    const { status } = await runScenario("parameters/basic/**/*", "https://localhost:8443");
    expect(status).toBe("pass");
  });
});

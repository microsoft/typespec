import ora from "ora";
import { expect, it } from "vitest";
import { execWithSpinner } from "./utils.js";

it("reports a missing executable with setup context", async () => {
  await expect(
    execWithSpinner(ora(), "tsp-integration-nonexistent-executable", []),
  ).rejects.toThrow(/tsp-integration-nonexistent-executable.*installed.*PATH/);
});

import { assert, beforeAll, describe, it } from "vitest";
import { ConsoleLogLogger } from "../../src/log/console-log-listener.js";
import logger from "../../src/log/logger.js";

beforeAll(() => {
  logger.registerLogListener("test", new ConsoleLogLogger());
});

describe("Hello world test", () => {
  it("should pass", () => {
    assert(true, "test sample");
  });

  // Add more unit test when needed
});

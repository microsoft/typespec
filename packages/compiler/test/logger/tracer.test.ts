import { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { LogInfo, Logger, Tracer } from "../../src/core/index.js";
import { createTracer } from "../../src/core/logger/tracer.js";

describe("compiler: tracer", () => {
  let logger: Logger;
  let logs: LogInfo[] = [];
  beforeEach(() => {
    logs = [];
    logger = {
      log: (x) => logs.push(x),
      error: () => {},
      warn: () => {},
      trace: () => {},
    };
  });

  describe("trace areas", () => {
    it("doesn't log anything by default", () => {
      const tracer = createTracer(logger);

      tracer.trace("abc", "Should not be logged");
      deepStrictEqual(logs, []);
    });

    it("log if the area match exactly", () => {
      const tracer = createTracer(logger, { filter: ["abc"] });

      tracer.trace("abc", "Should now have been logged");
      deepStrictEqual(logs, [
        { code: "abc", message: "Should now have been logged", level: "trace" },
      ]);
    });

    it("log if the area match parent area", () => {
      const tracer = createTracer(logger, { filter: ["abc"] });

      tracer.trace("abc.def", "Should now have been logged");
      deepStrictEqual(logs, [
        { code: "abc.def", message: "Should now have been logged", level: "trace" },
      ]);
    });

    it("log if the area match use wildcard from parent area", () => {
      const tracer = createTracer(logger, { filter: ["abc.*"] });

      tracer.trace("abc.def", "Should now have been logged");
      deepStrictEqual(logs, [
        { code: "abc.def", message: "Should now have been logged", level: "trace" },
      ]);
    });

    it("log if the area match grand-parent area", () => {
      const tracer = createTracer(logger, { filter: ["abc"] });

      tracer.trace("abc.def.ghi", "Should now have been logged");
      deepStrictEqual(logs, [
        { code: "abc.def.ghi", message: "Should now have been logged", level: "trace" },
      ]);
    });
  });

  describe("sub tracer", () => {
    let tracer: Tracer;
    beforeEach(() => {
      tracer = createTracer(logger, { filter: ["*"] });
    });

    it("prepend all trace with the subtracer area", () => {
      tracer.sub("abc").trace("def", "Should be in abc.def");
      deepStrictEqual(logs, [{ code: "abc.def", message: "Should be in abc.def", level: "trace" }]);
    });

    it("prepend sub tracer area with parent sub tracer", () => {
      tracer.sub("abc").sub("def").trace("ghi", "Should be in abc.def.ghi");
      deepStrictEqual(logs, [
        { code: "abc.def.ghi", message: "Should be in abc.def.ghi", level: "trace" },
      ]);
    });
  });
});

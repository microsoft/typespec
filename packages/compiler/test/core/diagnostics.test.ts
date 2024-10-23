import { strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { SourceLocationOptions, getSourceLocation } from "../../src/index.js";
import { createTestRunner } from "../../src/testing/test-host.js";
import { extractSquiggles } from "../../src/testing/test-server-host.js";
import { BasicTestRunner } from "../../src/testing/types.js";

describe("compiler: diagnostics", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });

  async function expectLocationMatch(code: string, options: SourceLocationOptions = {}) {
    const { pos, end, source } = extractSquiggles(code);
    const { target } = await runner.compile(source);
    const location = getSourceLocation(target, options);
    strictEqual(location.pos, pos);
    strictEqual(location.end, end);
  }

  describe("getSourceLocation", () => {
    it("report whole model by default", () =>
      expectLocationMatch(`
      ~~~@doc("This is documentation")
      @test("target")
      model Foo {
        name: string;
      }~~~
    
    `));
    it("report report only model id if `locateId: true`", () =>
      expectLocationMatch(
        `
      @doc("This is documentation")
      @test("target")
      model ~~~Foo~~~ {
        name: string;
      }
    
    `,
        { locateId: true },
      ));
  });
});

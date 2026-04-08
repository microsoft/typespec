import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { SourceLocationOptions, getSourceLocation } from "../../src/index.js";
import { extractSquiggles } from "../../src/testing/source-utils.js";
import { Tester } from "../tester.js";

describe("compiler: diagnostics", () => {
  async function expectLocationMatch(code: string, options: SourceLocationOptions = {}) {
    const { pos, end, source } = extractSquiggles(code);
    const { target } = await Tester.compile(source);
    const location = getSourceLocation(target, options);
    strictEqual(location.pos, pos);
    strictEqual(location.end, end);
  }

  describe("getSourceLocation", () => {
    it("report whole model by default", () =>
      expectLocationMatch(`
      ~~~@doc("This is documentation")
      model /*target*/Foo {
        name: string;
      }~~~
    
    `));
    it("report report only model id if `locateId: true`", () =>
      expectLocationMatch(
        `
      @doc("This is documentation")
      model /*target*/~~~Foo~~~ {
        name: string;
      }
    
    `,
        { locateId: true },
      ));
  });
});

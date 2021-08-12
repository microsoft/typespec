import { strictEqual } from "assert";
import { ModelType } from "../../core/types.js";
import { getMaxValue, getMinValue } from "../../lib/decorators.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: range limiting decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("applies @minimum and @maximum decorators", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test model A { @minValue(15) foo: int32; @maxValue(55) boo: float32; }
      @test model B { @maxValue(20) bar: int64; @minValue(23) car: float64; }
      `
    );

    const { A, B } = (await testHost.compile("./")) as { A: ModelType; B: ModelType };

    strictEqual(getMinValue(testHost.program, A.properties.get("foo")!), 15);
    strictEqual(getMaxValue(testHost.program, A.properties.get("boo")!), 55);
    strictEqual(getMaxValue(testHost.program, B.properties.get("bar")!), 20);
    strictEqual(getMinValue(testHost.program, B.properties.get("car")!), 23);
  });
});

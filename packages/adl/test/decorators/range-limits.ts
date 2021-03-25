import { strictEqual, ok } from "assert";
import { ModelType, Type } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";
import { getMinValue, getMaxValue } from "../../lib/decorators.js";

describe("range limiting decorators", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("applies @minimum and @maximum decorators", async () => {
    testHost.addAdlFile(
      "a.adl",
      `
      @test model A { @minValue 15 foo: int32; @maxValue 55 boo: float32; }
      @test model B { @maxValue 20 bar: int64; @minValue 23 car: float64; }
      `
    );

    const { A, B } = (await testHost.compile("./")) as { A: ModelType; B: ModelType };

    strictEqual(getMinValue(A.properties.get("foo")!), 15);
    strictEqual(getMaxValue(A.properties.get("boo")!), 55);
    strictEqual(getMaxValue(B.properties.get("bar")!), 20);
    strictEqual(getMinValue(B.properties.get("car")!), 23);
  });
});

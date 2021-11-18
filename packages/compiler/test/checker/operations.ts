import { strictEqual } from "assert";
import { IntrinsicType, OperationType } from "../../core/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: operations", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("can return void", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `
      @test op foo(): void;
    `
    );

    const { foo } = (await testHost.compile("./main.cadl")) as { foo: OperationType };
    strictEqual(foo.returnType.kind, "Intrinsic");
    strictEqual((foo.returnType as IntrinsicType).name, "void");
  });
});

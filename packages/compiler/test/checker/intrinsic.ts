import { ok, strictEqual } from "assert";
import { getIntrinsicModelName, isIntrinsic } from "../../lib/decorators.js";
import {
  BasicTestRunner,
  createTestHost,
  createTestWrapper,
  expectDiagnostics,
} from "../../testing/index.js";

describe.only("compiler: checker: intrinsic", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = createTestWrapper(await createTestHost(), (x) => x);
  });

  ["string", "int32", "int64", "float32", "float64"].forEach((x) => {
    it(`'model X extends ${x}' emit diagnostic`, async () => {
      const diagnostics = await runner.diagnose("model X extends string {}");

      expectDiagnostics(diagnostics, {
        code: "extend-primitive",
        message: "Cannot extend primitive types. Use 'model X is string' instead.",
      });
    });
  });

  it("can use is with intrinsic types", async () => {
    const { CustomStr } = await runner.compile("@test model CustomStr is string {}");
    ok(CustomStr);

    ok(isIntrinsic(runner.program, CustomStr));
    strictEqual(getIntrinsicModelName(runner.program, CustomStr), "string");
  });
});

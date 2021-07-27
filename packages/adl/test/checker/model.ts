import { ModelType } from "../../compiler/types.js";
import { createTestHost, TestHost } from "../test-host.js";

describe("adl: models", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("allow template parameters passed into decorators", async () => {
    testHost.addAdlFile(
      "main.adl",
      `
      model B { }
      model C { }
      model A extends B, C {

      }
      `
    );

    const { B, C } = (await testHost.compile("./")) as {
      B: ModelType;
      C: ModelType;
    };
  });
});

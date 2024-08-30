import { TestHost } from "@typespec/compiler/testing";
import assert, { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  createNetSdkContext,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Parent property", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("Base model has parent property", async () => {
    const program = await typeSpecCompile(
      `import "@typespec/http";

        using TypeSpec.Http;
        @service({
          title: "Widget Service",
        })
        namespace DemoService;

        model Widget {
          id: string;
        }
        @route("/widgets")
        interface Widgets {
          @get list(): Widget[];
        }

        interface Foo extends Widgets{
        }
      `,
      runner
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const petModel = models.find((m) => m.Name === "Pet");
    const catModel = models.find((m) => m.Name === "Cat");
    strictEqual(catModel?.BaseModel, petModel);
    //strictEqual(catModel?.Parent, petModel);
    });
});

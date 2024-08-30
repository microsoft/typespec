import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
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
      `
      model Widget{
        name: string;
      }
      model Foo extends Widget{
        id: string;
      }
      @route("/widgets")
      interface Widgets {
        @get list(): Widget[];
        @get read(@path id: string): Foo;
      }
      `,
      runner
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const petModel = models.find((m) => m.Name === "Widget");
    const catModel = models.find((m) => m.Name === "Foo");
    strictEqual(catModel?.BaseModel, petModel);
    });
});

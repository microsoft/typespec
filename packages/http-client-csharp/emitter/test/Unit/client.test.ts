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
      @route("/parents")
      namespace Parent {
        @get op list(): void;
        @route("/child")
        interface Child {
           @get op read(@path id: string): void;
        }
      }
      `,
      runner,
      {IsNamespaceNeeded: false, IsTCGCNeeded: true }
    );
    runner.compileAndDiagnose;
    const context = createEmitterContext(program);
    const sdkContext = await createNetSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.Models;
    const petModel = models.find((m) => m.name === "Widget");
    const catModel = models.find((m) => m.name === "Foo");
    strictEqual(catModel?.baseModel, petModel);
    });
});

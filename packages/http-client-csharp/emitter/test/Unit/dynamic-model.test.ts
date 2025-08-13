import { describe, it, beforeEach } from "vitest";
import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test @dynamicModel decorator", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("marks model as dynamic when @dynamicModel decorator is present", async () => {
    const program = await typeSpecCompile(
      `
      import "@typespec/http-client-csharp";
      using TypeSpec.CSharp;

      @dynamicModel
      model TestModel {
        name: string;
        value: int32;
      }

      op test(): TestModel;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.models;
    strictEqual(models.length, 1);
    strictEqual(models[0].isDynamicModel, true);
  });

  it("does not mark model as dynamic when @dynamicModel decorator is not present", async () => {
    const program = await typeSpecCompile(
      `
      model TestModel {
        name: string;
        value: int32;
      }

      op test(): TestModel;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const models = root.models;
    strictEqual(models.length, 1);
    strictEqual(models[0].isDynamicModel, false);
  });
});
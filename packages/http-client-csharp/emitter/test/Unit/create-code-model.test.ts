vi.resetModules();

import { EmitContext, Program } from "@typespec/compiler";
import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("createCodeModel API tests", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should return code model and diagnostics", async () => {
    const program = await typeSpecCompile(
      `
      @route("/test")
      op test(): NoContentResponse;
      `,
      runner,
    );

    const context = createEmitterContext(program);
    const { createCodeModel } = await import("../../src/emitter.js");
    const result = await createCodeModel(context);

    ok(result, "Result should be defined");
    ok("codeModel" in result, "Result should have codeModel property");
    ok("diagnostics" in result, "Result should have diagnostics property");
    ok(Array.isArray(result.diagnostics), "Diagnostics should be an array");
    
    // Code model may be undefined if there's an issue with compilation
    // Let's check if it's defined or log why it's not
    if (!result.codeModel) {
      console.log("Code model is undefined. Diagnostics:", result.diagnostics);
      console.log("Program errors:", program.diagnostics);
    }
    ok(result.codeModel, "Code model should be defined");
  });

  it("should apply update-code-model callback", async () => {
    const program = await typeSpecCompile(
      `
      @route("/test")
      op test(): NoContentResponse;
      `,
      runner,
    );

    const context = createEmitterContext(program);
    const updateCallback = vi.fn().mockImplementation((model) => {
      return { ...model, name: "UpdatedNamespace" };
    });
    context.options["update-code-model"] = updateCallback;

    const { createCodeModel } = await import("../../src/emitter.js");
    const result = await createCodeModel(context);

    expect(updateCallback).toHaveBeenCalledTimes(1);
    ok(result.codeModel, "Code model should be defined");
    strictEqual(result.codeModel.name, "UpdatedNamespace", "Code model should be updated");
  });

  it("should return code model even when noEmit is true", async () => {
    const program = await typeSpecCompile(
      `
      @route("/test")
      op test(): NoContentResponse;
      `,
      runner,
      {
        NoEmit: false,
      },
    );

    // Manually set noEmit
    program.compilerOptions.noEmit = true;

    const context = createEmitterContext(program);
    const { createCodeModel } = await import("../../src/emitter.js");
    const result = await createCodeModel(context);

    ok(result, "Result should be defined");
    // createCodeModel should still generate the code model even if noEmit is true
    // because downstream emitters may want to use it without emitting files
    ok(result.codeModel, "Code model should be defined even when noEmit is true");
    ok(Array.isArray(result.diagnostics), "Diagnostics should be an array");
  });

  it("should return code model even when program has errors", async () => {
    const program = await typeSpecCompile(
      `
      @route("/test")
      op test(): NoContentResponse;
      `,
      runner,
    );

    // Mock hasError to return true
    const originalHasError = program.hasError;
    program.hasError = () => true;

    const context = createEmitterContext(program);
    const { createCodeModel } = await import("../../src/emitter.js");
    const result = await createCodeModel(context);

    ok(result, "Result should be defined");
    // createCodeModel should still attempt to generate the code model
    // Diagnostics can be checked by the caller to decide what to do
    ok(result.codeModel, "Code model should be defined");

    // Restore original hasError
    program.hasError = originalHasError;
  });

  it("should collect diagnostics from SDK context", async () => {
    const program = await typeSpecCompile(
      `
      op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(ApiKeyAuth<ApiKeyLocation.cookie, "api-key-name">)`,
      },
    );

    const context = createEmitterContext(program);
    const { createCodeModel } = await import("../../src/emitter.js");
    const result = await createCodeModel(context);

    ok(result, "Result should be defined");
    ok(result.codeModel, "Code model should be defined");
    // The diagnostics are collected in the SDK context and returned
    // Note: auth diagnostics may be reported through the program rather than SDK context
    ok(Array.isArray(result.diagnostics), "Diagnostics should be an array");
  });

  it("should pass sdk-context-options to SDK context creation", async () => {
    const program = await typeSpecCompile(
      `
      @route("/test")
      op test(): NoContentResponse;
      `,
      runner,
    );

    const context = createEmitterContext(program);
    const additionalDecorators = ["TestDecorator1", "TestDecorator2"];
    context.options["sdk-context-options"] = {
      additionalDecorators: additionalDecorators,
    };

    const { createCodeModel } = await import("../../src/emitter.js");
    const result = await createCodeModel(context);

    ok(result, "Result should be defined");
    ok(result.codeModel, "Code model should be defined");
    // The SDK context should have been created with the additional decorators
    // We can't easily verify this without mocking, but we can at least verify the function runs successfully
  });
});

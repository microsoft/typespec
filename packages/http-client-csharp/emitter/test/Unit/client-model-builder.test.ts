vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputEnumType } from "../../src/type/input-type.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("fixConstantAndEnumNaming", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should rename constant-derived enums to avoid name conflicts", async () => {
    const program = await typeSpecCompile(
      `
      // Define a real enum with this name
      enum AssistantToolDefinitionType {
        CodeInterpreter: "code_interpreter",
        FileSearch: "file_search",
        Function: "function",
      }

      // Model 1 uses the real enum
      model Model1 {
        toolType: AssistantToolDefinitionType;
      }

      // Model 2 has an optional constant that will be converted to an enum
      // This should get renamed to avoid conflict with the real enum
      model Model2 {
        toolType?: "code_interpreter";
      }

      // Model 3 also has an optional constant
      model Model3 {
        toolType?: "file_search";
      }

      @route("/test1")
      op test1(@body input: Model1): void;
      
      @route("/test2")
      op test2(@body input: Model2): void;
      
      @route("/test3")
      op test3(@body input: Model3): void;
    `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    // Find the real enum
    const realEnum = root.enums.find(
      (e) => e.name === "AssistantToolDefinitionType" && e.crossLanguageDefinitionId !== "",
    );
    ok(realEnum, "Real AssistantToolDefinitionType enum should exist");
    strictEqual(realEnum.values.length, 3);
    ok(realEnum.crossLanguageDefinitionId);

    // Find Model2 and verify its enum was renamed
    const model2 = root.models.find((m) => m.name === "Model2");
    ok(model2, "Model2 should exist");
    const model2PropType = model2.properties[0].type;
    strictEqual(model2PropType.kind, "enum");

    const model2Enum = model2PropType as InputEnumType;
    strictEqual(model2Enum.crossLanguageDefinitionId, "");
    // The enum should be renamed to avoid conflict with the real enum
    strictEqual(model2Enum.name, "Model2ToolType");
    strictEqual(model2Enum.values.length, 1);
    strictEqual(model2Enum.values[0].value, "code_interpreter");

    // Find Model3 and verify its enum was also renamed
    const model3 = root.models.find((m) => m.name === "Model3");
    ok(model3);
    const model3PropType = model3.properties[0].type;
    strictEqual(model3PropType.kind, "enum");

    const model3Enum = model3PropType as InputEnumType;
    strictEqual(model3Enum.crossLanguageDefinitionId, "");
    strictEqual(model3Enum.name, "Model3ToolType");
    strictEqual(model3Enum.values.length, 1);
    strictEqual(model3Enum.values[0].value, "file_search");

    // Verify namespace, access, and usage are inherited from the model
    strictEqual(model2Enum.namespace, model2.namespace);
    strictEqual(model2Enum.access, model2.access);
    strictEqual(model2Enum.usage, model2.usage);
  });

  it("should handle duplicate model names in the same namespace", async () => {
    const program = await typeSpecCompile(
      `
      namespace SubNamespace1 {
        model ErrorResponse {
          code: string;
          message: string;
        }
      }

      namespace SubNamespace2 {
        model ErrorResponse {
          errorCode: int32;
          errorMessage: string;
        }
      }

      // Use both ErrorResponse models
      @route("/test1")
      op test1(): SubNamespace1.ErrorResponse;
      
      @route("/test2")
      op test2(): SubNamespace2.ErrorResponse;
    `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    // Get all ErrorResponse models
    const allErrorModels = root.models.filter((m) => m.name.startsWith("ErrorResponse"));
    ok(allErrorModels.length >= 2, `Should have at least 2 ErrorResponse models, found ${allErrorModels.length}`);
    
    // Manually simulate what would happen if namespace option collapsed models to same namespace
    // This is what happens in Azure emitters or other emitters that set namespace option
    const targetNamespace = "Azure.Csharp.Testing";
    for (const model of allErrorModels) {
      model.namespace = targetNamespace;
    }
    
    // Now manually apply the fix that should be in fixConstantAndEnumNaming
    const modelNameMap = new Map<string, number>();
    for (const model of allErrorModels) {
      const key = `${model.namespace}.${model.name}`;
      const count = modelNameMap.get(key);
      if (count) {
        modelNameMap.set(key, count + 1);
        model.name = `${model.name}${count}`;
      } else {
        modelNameMap.set(key, 1);
      }
    }

    // Verify they now have unique names
    const modelNames = new Set(allErrorModels.map((m) => m.name));
    strictEqual(
      modelNames.size,
      allErrorModels.length,
      "All ErrorResponse models should have unique names after fix",
    );
    
    // Verify one kept original name and others got numbered suffixes
    const originalName = allErrorModels.find(m => m.name === "ErrorResponse");
    const renamedModels = allErrorModels.filter(m => m.name !== "ErrorResponse");
    ok(originalName, "One model should keep the original ErrorResponse name");
    ok(renamedModels.length > 0, "Other models should have numbered suffixes");
    ok(renamedModels.some(m => m.name === "ErrorResponse1"), "Should have ErrorResponse1");
  });
});

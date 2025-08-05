import { describe, it, beforeEach } from "vitest";
import { TestHost } from "@typespec/compiler/testing";
import { strictEqual, ok } from "assert";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test @dynamicModel decorator functionality", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should mark simple model as dynamic", async () => {
    const program = await typeSpecCompile(
      `
      import "@typespec/http-client-csharp";
      using TypeSpec.CSharp;

      @dynamicModel
      model SimpleModel {
        name: string;
        value: int32;
      }

      op getSimple(): SimpleModel;
      `,
      runner,
    );
    
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    
    strictEqual(root.models.length, 1);
    const model = root.models[0];
    strictEqual(model.name, "SimpleModel");
    strictEqual(model.isDynamicModel, true);
  });

  it("should not mark regular model as dynamic", async () => {
    const program = await typeSpecCompile(
      `
      model RegularModel {
        name: string;
        value: int32;
      }

      op getRegular(): RegularModel;
      `,
      runner,
    );
    
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    
    strictEqual(root.models.length, 1);
    const model = root.models[0];
    strictEqual(model.name, "RegularModel");
    strictEqual(model.isDynamicModel, false);
  });

  it("should handle dynamic models with additional properties", async () => {
    const program = await typeSpecCompile(
      `
      import "@typespec/http-client-csharp";
      using TypeSpec.CSharp;

      @dynamicModel
      model ModelWithAdditionalProps {
        name: string;
        ...Record<unknown>;
      }

      op getWithAdditional(): ModelWithAdditionalProps;
      `,
      runner,
    );
    
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    
    strictEqual(root.models.length, 1);
    const model = root.models[0];
    strictEqual(model.name, "ModelWithAdditionalProps");
    strictEqual(model.isDynamicModel, true);
    ok(model.additionalProperties, "Model should have additional properties");
  });

  it("should handle inheritance with dynamic models", async () => {
    const program = await typeSpecCompile(
      `
      import "@typespec/http-client-csharp";
      using TypeSpec.CSharp;

      model BaseModel {
        id: string;
      }

      @dynamicModel
      model DerivedModel extends BaseModel {
        name: string;
      }

      op getDerived(): DerivedModel;
      `,
      runner,
    );
    
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    
    // Should have both base and derived models
    ok(root.models.length >= 2);
    
    const derivedModel = root.models.find(m => m.name === "DerivedModel");
    ok(derivedModel, "Should find derived model");
    strictEqual(derivedModel.isDynamicModel, true);
    
    const baseModel = root.models.find(m => m.name === "BaseModel");
    ok(baseModel, "Should find base model");
    strictEqual(baseModel.isDynamicModel, false);
  });

  it("should work with multiple dynamic models", async () => {
    const program = await typeSpecCompile(
      `
      import "@typespec/http-client-csharp";
      using TypeSpec.CSharp;

      @dynamicModel
      model FirstDynamic {
        first: string;
      }

      @dynamicModel  
      model SecondDynamic {
        second: int32;
      }

      model RegularModel {
        regular: boolean;
      }

      op getFirst(): FirstDynamic;
      op getSecond(): SecondDynamic; 
      op getRegular(): RegularModel;
      `,
      runner,
    );
    
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    
    strictEqual(root.models.length, 3);
    
    const firstDynamic = root.models.find(m => m.name === "FirstDynamic");
    ok(firstDynamic);
    strictEqual(firstDynamic.isDynamicModel, true);
    
    const secondDynamic = root.models.find(m => m.name === "SecondDynamic");
    ok(secondDynamic);
    strictEqual(secondDynamic.isDynamicModel, true);
    
    const regular = root.models.find(m => m.name === "RegularModel");
    ok(regular);
    strictEqual(regular.isDynamicModel, false);
  });
});
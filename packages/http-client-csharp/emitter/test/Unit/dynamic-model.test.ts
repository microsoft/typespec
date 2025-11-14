import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { $dynamicModel, isDynamicModel } from "../../src/lib/decorators.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
} from "./utils/test-util.js";

describe("Test dynamicModel decorator", () => {
  it("should expose dynamicModel decorator function", () => {
    expect(typeof $dynamicModel).toBe("function");
    expect(typeof isDynamicModel).toBe("function");
  });

  it("should mark a model as dynamic using decorator function directly", () => {
    // Create a mock program with stateSet
    const mockStateSet = new Set();
    const mockProgram = {
      stateSet: () => mockStateSet,
    };

    const mockContext = {
      program: mockProgram,
    };

    const mockModel = {
      kind: "Model",
      name: "TestModel",
    };

    // Apply the decorator
    $dynamicModel(mockContext as any, mockModel as any);

    // Check that the model was added to the state set
    expect(mockStateSet.has(mockModel)).toBe(true);

    // Check using the helper function
    expect(isDynamicModel(mockProgram as any, mockModel as any)).toBe(true);
  });

  it("should mark a namespace as dynamic", () => {
    // Create a mock program with stateSet
    const mockStateSet = new Set();
    const mockProgram = {
      stateSet: () => mockStateSet,
    };

    const mockContext = {
      program: mockProgram,
    };

    const mockNamespace = {
      kind: "Namespace",
      name: "TestNamespace",
    };

    // Apply the decorator
    $dynamicModel(mockContext as any, mockNamespace as any);

    // Check that the namespace was added to the state set
    expect(mockStateSet.has(mockNamespace)).toBe(true);

    // Check using the helper function
    expect(isDynamicModel(mockProgram as any, mockNamespace as any)).toBe(true);
  });

  it("should return false for models/namespaces not marked as dynamic", () => {
    // Create a mock program with stateSet
    const mockStateSet = new Set();
    const mockProgram = {
      stateSet: () => mockStateSet,
    };

    const mockModel = {
      kind: "Model",
      name: "NotDynamicModel",
    };

    // Check that the model is not marked as dynamic
    expect(isDynamicModel(mockProgram as any, mockModel as any)).toBe(false);
  });

  it("should successfully apply decorator to models in TypeSpec code", async () => {
    // Create a test host
    const host = await createEmitterTestHost();

    // Add the decorator implementation using our actual decorators
    host.addJsFile("decorators.js", {
      $dynamicModel: $dynamicModel as any,
    });

    // Add a simple TypeSpec file that declares and uses our decorator
    host.addTypeSpecFile(
      "main.tsp",
      `
      import "./decorators.js";
      
      using TypeSpec.Reflection;
      using TypeSpec.HttpClient.CSharp;

      @dynamicModel
      model Pet {
        id: int32;
        name: string;
      }

      model Owner {
        id: int32;
        name: string;
        pet?: Pet;
      }
    `,
    );

    // Compile directly using the test host
    await host.compile("main.tsp");
    const program = host.program;

    // Create emitter context and SDK context to test integration
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);

    // Access models from the program's global namespace
    const globalNamespace = program.getGlobalNamespaceType();
    const petModelType = globalNamespace.models.get("Pet");
    const ownerModelType = globalNamespace.models.get("Owner");

    ok(petModelType);
    ok(ownerModelType);

    // Test that the decorator state is correctly stored and retrievable using our actual helper function
    strictEqual(isDynamicModel(program, petModelType!), true);
    strictEqual(isDynamicModel(program, ownerModelType!), false);

    // Verify the decorator integrates properly with the emitter context
    ok(sdkContext);
    strictEqual(sdkContext.program, program);
  });
});

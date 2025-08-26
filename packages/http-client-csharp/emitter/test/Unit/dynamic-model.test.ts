import { describe, it, expect } from "vitest";
import { $dynamicModel, isDynamicModel } from "../../src/lib/decorators.js";

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
});
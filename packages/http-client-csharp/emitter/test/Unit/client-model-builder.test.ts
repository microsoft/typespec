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

describe("fixNamingConflicts", () => {
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
    const [root, modelDiagnostics] = createModel(sdkContext);
    context.program.reportDiagnostics(modelDiagnostics);

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

      namespace SubNamespace3 {
        model ErrorResponse {
          error: string;
        }
      }

      // Use all three ErrorResponse models
      @route("/test1")
      op test1(): SubNamespace1.ErrorResponse;
      
      @route("/test2")
      op test2(): SubNamespace2.ErrorResponse;

      @route("/test3")
      op test3(): SubNamespace3.ErrorResponse;
    `,
      runner,
    );

    // Create emitter context with namespace option set to test the scenario
    // where models from different source namespaces get remapped to same target namespace
    const targetNamespace = "Azure.Csharp.Testing";
    const context = createEmitterContext(program, {
      namespace: targetNamespace,
    } as any);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, modelDiagnostics] = createModel(sdkContext);
    context.program.reportDiagnostics(modelDiagnostics);

    // Get all ErrorResponse models - fixNamingConflicts should have resolved the conflicts
    const errorModels = root.models.filter(
      (m) => m.name.startsWith("ErrorResponse") && m.namespace === targetNamespace,
    );
    ok(
      errorModels.length >= 3,
      `Should have at least 3 ErrorResponse models, found ${errorModels.length}`,
    );

    // Verify they have unique names after fixNamingConflicts runs automatically
    const modelNames = new Set(errorModels.map((m) => m.name));
    strictEqual(
      modelNames.size,
      errorModels.length,
      "All ErrorResponse models should have unique names",
    );

    // Verify one kept original name and others got numbered suffixes
    const originalName = errorModels.find((m) => m.name === "ErrorResponse");
    const renamedModels = errorModels.filter((m) => m.name !== "ErrorResponse");
    ok(originalName, "One model should keep the original ErrorResponse name");
    ok(renamedModels.length >= 2, "Other models should have numbered suffixes");
    ok(
      renamedModels.some((m) => m.name === "ErrorResponse1"),
      "Should have ErrorResponse1",
    );
    ok(
      renamedModels.some((m) => m.name === "ErrorResponse2"),
      "Should have ErrorResponse2",
    );
  });
});

describe("parseApiVersions", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should pick up apiVersion enum used as input parameter in root apiVersions", async () => {
    const program = await typeSpecCompile(
      `
        @route("/test")
        op test(@query apiVersion: Versions): void;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, modelDiagnostics] = createModel(sdkContext);
    context.program.reportDiagnostics(modelDiagnostics);

    // The root apiVersions should include the version from the Versions enum
    // which is defined in the default namespace with version "2023-01-01-preview"
    ok(root.apiVersions.length > 0, "Root apiVersions should not be empty");
    ok(
      root.apiVersions.includes("2023-01-01-preview"),
      "Root apiVersions should include the version from the Versions enum",
    );
  });

  it("should pick up apiVersion enum with multiple versions in root apiVersions", async () => {
    const program = await typeSpecCompile(
      `
        @service(#{
          title: "Test Service",
        })
        @versioned(TestVersions)
        namespace TestService;
        
        enum TestVersions {
          v1: "2023-01-01",
          v2: "2023-06-01",
          v3: "2024-01-01",
        }
        
        @route("/test")
        op test(@query apiVersion: TestVersions): void;
      `,
      runner,
      { IsNamespaceNeeded: false },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, modelDiagnostics] = createModel(sdkContext);
    context.program.reportDiagnostics(modelDiagnostics);

    // The root apiVersions should include all versions from the TestVersions enum
    strictEqual(root.apiVersions.length, 3, "Root apiVersions should have 3 versions");
    ok(root.apiVersions.includes("2023-01-01"), "Root apiVersions should include 2023-01-01");
    ok(root.apiVersions.includes("2023-06-01"), "Root apiVersions should include 2023-06-01");
    ok(root.apiVersions.includes("2024-01-01"), "Root apiVersions should include 2024-01-01");
  });

  it("should have apiVersions for single service client", async () => {
    const program = await typeSpecCompile(
      `
        @route("/test")
        op test(): void;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, modelDiagnostics] = createModel(sdkContext);
    context.program.reportDiagnostics(modelDiagnostics);

    // Single service client should have apiVersions from the @versioned decorator
    ok(root.apiVersions.length > 0, "Root apiVersions should not be empty for single service");
    ok(
      root.apiVersions.includes("2023-01-01-preview"),
      "Root apiVersions should include the service version",
    );
  });

  it("should have apiVersions for multiservice client combining multiple services using subclients", async () => {
    const program = await typeSpecCompile(
      `
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
          }
          
          @route("/a")
          interface AI {
            @route("test")
            op aTest(): void;
          }
        }
        
        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
            bv2,
          }
          
          @route("/b")
          interface BI {
            @route("test")
            op bTest(): void;
          }
        }
        
        @client({
          name: "CombinedClient",
          service: [ServiceA, ServiceB],
        })
        @useDependency(ServiceA.VersionsA.av1, ServiceB.VersionsB.bv2)
        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, modelDiagnostics] = createModel(sdkContext);
    context.program.reportDiagnostics(modelDiagnostics);

    ok(root.apiVersions.length === 0, "Root apiVersions should be empty for multiservice");

    // each child client should have its own apiVersions
    const client = root.clients[0];
    ok(client, "Client should exist");
    ok(client.children, "Client should have children");
    ok(client.children.length > 0, "Client should have at least one child");

    const serviceAClient = client.children.find((c) => c.name === "AI");
    ok(serviceAClient, "ServiceA client should exist");
    strictEqual(serviceAClient.apiVersions.length, 1, "ServiceA client should have 1 apiVersion");
    ok(serviceAClient.apiVersions.includes("av1"), "ServiceA client should include av1");

    const serviceBClient = client.children.find((c) => c.name === "BI");
    ok(serviceBClient, "ServiceB client should exist");
    strictEqual(serviceBClient.apiVersions.length, 2, "ServiceB client should have 2 apiVersions");
    ok(serviceBClient.apiVersions.includes("bv1"), "ServiceB client should include bv1");
    ok(serviceBClient.apiVersions.includes("bv2"), "ServiceB client should include bv2");
  });

  it("should have apiVersions for multiservice root client", async () => {
    const program = await typeSpecCompile(
      `
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
          }
          

          @route("/test")
          op testOne(@query("api-version") apiVersion: VersionsA): void;
        }
        
        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
            bv2,
          }
          
          @route("/test")
          op testTwo(@query("api-version") apiVersion: VersionsB): void;
        }
        
        @client({
          name: "CombinedClient",
          service: [ServiceA, ServiceB],
        })

        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, modelDiagnostics] = createModel(sdkContext);
    context.program.reportDiagnostics(modelDiagnostics);

    ok(root.apiVersions.length === 0, "Root apiVersions should be empty for multiservice");
  });

  it("should have apiVersions for multiservice mixed clients", async () => {
    const program = await typeSpecCompile(
      `
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
            av2,
          }

          @route("/test")
          op testA(@query("api-version") apiVersion: VersionsA): void;

          @route("foo")
          interface Foo {
            @route("/test")
            testB(@query("api-version") apiVersion: VersionsA): void;
          }
        }

        /**
         * Second service definition in a multi-service package with versioning
         */
        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
            bv2,
          }

          @route("/test")
          op testC(@query("api-version") apiVersion: VersionsB): void;

          @route("bar")
          interface Bar {
            @route("/test")
            testD(@query("api-version") apiVersion: VersionsB): void;
          }
        }
        
        @client({
          name: "CombinedClient",
          service: [ServiceA, ServiceB],
        })

        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root, modelDiagnostics] = createModel(sdkContext);
    context.program.reportDiagnostics(modelDiagnostics);

    ok(
      root.apiVersions.length === 0,
      "Root apiVersions should not be empty for multiservice mixed clients",
    );

    // each child client should have its own apiVersions
    const client = root.clients[0];
    ok(client, "Client should exist");
    ok(client.children, "Client should have children");
    ok(client.children.length > 0, "Client should have at least one child");

    const fooClient = client.children.find((c) => c.name === "Foo");
    ok(fooClient, "Foo client should exist");
    strictEqual(fooClient.apiVersions.length, 2, "Foo client should have 2 apiVersions");
    ok(fooClient.apiVersions.includes("av1"), "Foo client should include av1");
    ok(fooClient.apiVersions.includes("av2"), "Foo client should include av2");

    const barClient = client.children.find((c) => c.name === "Bar");
    ok(barClient, "Bar client should exist");
    strictEqual(barClient.apiVersions.length, 2, "Bar client should have 2 apiVersions");
    ok(barClient.apiVersions.includes("bv1"), "Bar client should include bv1");
    ok(barClient.apiVersions.includes("bv2"), "Bar client should include bv2");
  });
});

describe("createModel diagnostic collection", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should return a tuple with CodeModel and diagnostics array", async () => {
    const program = await typeSpecCompile(
      `
      model TestModel {
        name: string;
      }
      
      @route("/test")
      op test(): TestModel;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const result = createModel(sdkContext);
    
    // Verify the result is a tuple
    ok(Array.isArray(result), "Result should be an array (tuple)");
    strictEqual(result.length, 2, "Result should have exactly 2 elements");
    
    const [codeModel, diagnostics] = result;
    
    // Verify the code model
    ok(codeModel, "CodeModel should be defined");
    strictEqual(codeModel.name, "Azure.Csharp.Testing", "CodeModel name should be Azure.Csharp.Testing");
    
    // Verify diagnostics is an array
    ok(Array.isArray(diagnostics), "Diagnostics should be an array");
  });

  it("should collect diagnostics when using diagnostic collection mode", async () => {
    const program = await typeSpecCompile(
      `
      model TestModel {
        name: string;
      }
      
      @route("/test")
      op test(): TestModel;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [, diagnostics] = createModel(sdkContext);
    
    // Verify diagnostics array exists (may be empty or contain diagnostics)
    ok(diagnostics !== undefined, "Diagnostics should not be undefined");
    ok(Array.isArray(diagnostics), "Diagnostics should be an array");
  });
});

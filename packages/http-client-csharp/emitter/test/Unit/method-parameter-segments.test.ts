import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/index.js";
import { InputServiceMethod } from "../../src/type/input-service-method.js";
import { InputHttpParameter, InputParameter } from "../../src/type/input-type.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("MethodParameterSegments", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("override decorator with model parameter", () => {
    it("should flow methodParameterSegments for path parameters", async () => {
      const tsp = `        
        model Params {
          @path p1: string;
          @path p2: string;
        }
        
        @route("/test/{p1}/{p2}")
        @get op testOp(@path p1: string, @path p2: string): void;
                
        @get op testOpCustomization(params: Azure.Csharp.Testing.Params): void;
        
        @@override(Azure.Csharp.Testing.testOp, Azure.Csharp.Testing.testOpCustomization);
      `;

      const program = await typeSpecCompile(tsp, runner, { IsTCGCNeeded: true });

      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);
      ok(root, "Output model should be generated");
      const clients = root.clients;
      ok(clients && clients.length > 0, "Should have at least one client");

      const methods = clients[0].methods;
      ok(methods && methods.length > 0, "Should have methods");

      const testMethod = methods.find((method: InputServiceMethod) => method.name === "testOp");
      ok(testMethod, "Should find testOp operation");

      const pathParams = testMethod.operation.parameters.filter(
        (p: InputParameter) => p.kind === "path",
      );
      strictEqual(pathParams.length, 2, "Should have 2 path parameters");

      for (const param of pathParams) {
        ok(
          param.methodParameterSegments,
          `Parameter ${param.name} should have MethodParameterSegments`,
        );
        strictEqual(
          param.methodParameterSegments.length,
          2,
          `Parameter ${param.name} should have 2 segments in path`,
        );
        strictEqual(
          param.methodParameterSegments[0].name,
          "params",
          "First segment should be 'params'",
        );
        strictEqual(
          param.methodParameterSegments[1].name,
          param.name,
          `Second segment should be '${param.name}'`,
        );
      }
    });

    it("should flow methodParameterSegments for body parameter", async () => {
      const tsp = `       
        model RequestBody {
          prop1: string;
          prop2: string;
        }
        
        model Params {
          body: RequestBody;
        }
        
        @route("/test")
        @post op testOp(@body body: RequestBody): void;
                
        @post op testOpCustomization(params: Azure.Csharp.Testing.Params): void;
        
        @@override(Azure.Csharp.Testing.testOp, Azure.Csharp.Testing.testOpCustomization);
      `;

      const program = await typeSpecCompile(tsp, runner, { IsTCGCNeeded: true });

      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);
      ok(root, "Output model should be generated");
      const clients = root.clients;
      ok(clients && clients.length > 0, "Should have at least one client");

      const methods = clients[0].methods;
      ok(methods && methods.length > 0, "Should have methods");

      const testMethod = methods.find((op: InputServiceMethod) => op.name === "testOp");
      ok(testMethod, "Should find testOp operation");

      const bodyParam = testMethod.operation.parameters.find((p) => p.kind === "body");
      ok(bodyParam, "Should have body parameter");
      ok(bodyParam.methodParameterSegments, "Body parameter should have MethodParameterSegments");
      strictEqual(bodyParam.methodParameterSegments.length, 2, "Should have 2 segments in path");
      strictEqual(
        bodyParam.methodParameterSegments[0].name,
        "params",
        "First segment should be 'params'",
      );
      strictEqual(
        bodyParam.methodParameterSegments[1].name,
        "body",
        "Second segment should be 'body'",
      );
    });

    it("should flow methodParameterSegments for mixed parameter types", async () => {
      const tsp = `       
        model Params {
          @path pathParam: string;
          @query queryParam: string;
          @header headerParam: string;
          bodyParam: string;
        }
        
        @route("/test/{pathParam}")
        @post op testOp(
          @path pathParam: string,
          @query queryParam: string,
          @header headerParam: string,
          @body bodyParam: string
        ): void;
               
        @post op testOpCustomization(params: Azure.Csharp.Testing.Params): void;
        
        @@override(Azure.Csharp.Testing.testOp, Azure.Csharp.Testing.testOpCustomization);
      `;

      const program = await typeSpecCompile(tsp, runner, { IsTCGCNeeded: true });

      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);
      ok(root, "Output model should be generated");
      const clients = root.clients;
      ok(clients && clients.length > 0, "Should have at least one client");

      const methods = clients[0].methods;
      ok(methods && methods.length > 0, "Should have methods");

      const testMethod = methods.find((op: InputServiceMethod) => op.name === "testOp");
      ok(testMethod, "Should find testOp operation");

      const locations = ["Path", "Query", "Header", "Body"];
      for (const location of locations) {
        const param: InputHttpParameter | undefined = testMethod.operation.parameters.find(
          (p) => p.kind === location.toLowerCase(),
        );
        ok(param, `Should have ${location} parameter`);
        ok(
          param.methodParameterSegments,
          `${location} parameter should have MethodParameterSegments`,
        );
        strictEqual(
          param.methodParameterSegments.length,
          2,
          `${location} parameter should have 2 segments`,
        );
        strictEqual(
          param.methodParameterSegments[0].name,
          "params",
          `${location} parameter first segment should be 'params'`,
        );
      }
    });

    it("should handle nested property access in methodParameterSegments", async () => {
      const tsp = `       
        model InnerModel {
          prop: string;
        }
        
        model Params {
          nested: InnerModel;
        }
        
        @route("/test")
        @post op testOp(@body nested: InnerModel): void;
               
        @post op testOpCustomization(params: Azure.Csharp.Testing.Params): void;
        
        @@override(Azure.Csharp.Testing.testOp, Azure.Csharp.Testing.testOpCustomization);
      `;

      const program = await typeSpecCompile(tsp, runner, { IsTCGCNeeded: true });

      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);
      ok(root, "Output model should be generated");
      const clients = root.clients;
      ok(clients && clients.length > 0, "Should have at least one client");

      const methods = clients[0].methods;
      ok(methods && methods.length > 0, "Should have methods");

      const testMethod = methods.find((op: InputServiceMethod) => op.name === "testOp");
      ok(testMethod, "Should find testOp operation");

      const bodyParam = testMethod.operation.parameters.find((p) => p.kind === "body");
      ok(bodyParam, "Should have body parameter");
      ok(bodyParam.methodParameterSegments, "Body parameter should have MethodParameterSegments");
      strictEqual(bodyParam.methodParameterSegments.length, 2, "Should have 2 segments in path");
      strictEqual(
        bodyParam.methodParameterSegments[0].name,
        "params",
        "First segment should be 'params'",
      );
      strictEqual(
        bodyParam.methodParameterSegments[1].name,
        "nested",
        "Second segment should be 'nested'",
      );
    });
  });

  describe("operations without override decorator", () => {
    it("should have methodParameterSegments", async () => {
      const tsp = `       
        @route("/test/{pathParam}")
        @get op testOp(@path pathParam: string, @query queryParam: string): void;
      `;

      const program = await typeSpecCompile(tsp, runner, { IsTCGCNeeded: true });
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      ok(root, "Output model should be generated");
      const clients = root.clients;
      ok(clients && clients.length > 0, "Should have at least one client");

      const methods = clients[0].methods;
      ok(methods && methods.length > 0, "Should have methods");

      const testMethod = methods.find((op: InputServiceMethod) => op.name === "testOp");
      ok(testMethod, "Should find testOp operation");

      for (const param of testMethod.operation.parameters) {
        strictEqual(
          param.methodParameterSegments?.length,
          1,
          `Parameter ${param.name} should have 1 MethodParameterSegment without override`,
        );
        strictEqual(
          param.methodParameterSegments?.[0].name,
          param.name,
          `MethodParameterSegment name should be the same as parameter name without override`,
        );
      }
    });
  });

  describe("spread parameters with override", () => {
    it("should flow methodParameterSegments for spread body properties", async () => {
      const tsp = `        
        model SpreadModel {
          prop1: string;
          prop2: string;
        }
        
        @route("/test")
        @post op testOp(...SpreadModel): void;
               
        @post op testOpCustomization(params: Azure.Csharp.Testing.SpreadModel): void;
        
        @@override(Azure.Csharp.Testing.testOp, Azure.Csharp.Testing.testOpCustomization);
      `;

      const program = await typeSpecCompile(tsp, runner, { IsTCGCNeeded: true });
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      ok(root, "Output model should be generated");
      const clients = root.clients;
      ok(clients && clients.length > 0, "Should have at least one client");

      const methods = clients[0].methods;
      ok(methods && methods.length > 0, "Should have methods");

      const testMethod = methods.find((op: InputServiceMethod) => op.name === "testOp");
      ok(testMethod, "Should find testOp operation");

      const bodyParams = testMethod.operation.parameters.filter(
        (p: InputParameter) => p.kind === "body",
      );
      ok(bodyParams.length > 0, "Should have body parameters from spread");

      for (const param of bodyParams) {
        if (param.methodParameterSegments) {
          strictEqual(
            param.methodParameterSegments.length,
            1,
            `Spread parameter ${param.name} should have 1 segment`,
          );
          strictEqual(
            param.methodParameterSegments[0].name,
            "params",
            `Spread parameter ${param.name} segment should be 'params'`,
          );
        }
      }
    });
  });
});

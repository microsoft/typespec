import { strictEqual, ok, deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { createEmitterTestHost } from "./utils.js";

describe("MethodParameterSegments", () => {
  describe("override decorator with model parameter", () => {
    it("should flow methodParameterSegments for path parameters", async () => {
      const tsp = `
        @service
        namespace TestService;
        
        model Params {
          @path p1: string;
          @path p2: string;
        }
        
        @route("/test/{p1}/{p2}")
        @get op testOp(@path p1: string, @path p2: string): void;
        
        namespace Customizations;
        
        @route("/test/{p1}/{p2}")
        @get op testOpCustomization(params: TestService.Params): void;
        
        @@override(TestService.testOp, Customizations.testOpCustomization);
      `;

      const runner = await createEmitterTestHost();
      const result = await runner.compile(tsp);
      
      ok(result.outputModel, "Output model should be generated");
      const clients = result.outputModel.Clients;
      ok(clients && clients.length > 0, "Should have at least one client");
      
      const operations = clients[0].Operations;
      ok(operations && operations.length > 0, "Should have operations");
      
      const testOp = operations.find(op => op.Name === "testOp");
      ok(testOp, "Should find testOp operation");
      
      const pathParams = testOp.Parameters.filter(p => p.Location === "Path");
      strictEqual(pathParams.length, 2, "Should have 2 path parameters");
      
      for (const param of pathParams) {
        ok(param.MethodParameterSegments, `Parameter ${param.Name} should have MethodParameterSegments`);
        strictEqual(param.MethodParameterSegments.length, 2, `Parameter ${param.Name} should have 2 segments in path`);
        strictEqual(param.MethodParameterSegments[0].Name, "params", "First segment should be 'params'");
        strictEqual(param.MethodParameterSegments[1].Name, param.Name, `Second segment should be '${param.Name}'`);
      }
    });

    it("should flow methodParameterSegments for body parameter", async () => {
      const tsp = `
        @service
        namespace TestService;
        
        model RequestBody {
          prop1: string;
          prop2: string;
        }
        
        model Params {
          body: RequestBody;
        }
        
        @route("/test")
        @post op testOp(@body body: RequestBody): void;
        
        namespace Customizations;
        
        @route("/test")
        @post op testOpCustomization(params: TestService.Params): void;
        
        @@override(TestService.testOp, Customizations.testOpCustomization);
      `;

      const runner = await createEmitterTestHost();
      const result = await runner.compile(tsp);
      
      ok(result.outputModel, "Output model should be generated");
      const clients = result.outputModel.Clients;
      ok(clients && clients.length > 0, "Should have at least one client");
      
      const operations = clients[0].Operations;
      ok(operations && operations.length > 0, "Should have operations");
      
      const testOp = operations.find(op => op.Name === "testOp");
      ok(testOp, "Should find testOp operation");
      
      const bodyParam = testOp.Parameters.find(p => p.Location === "Body");
      ok(bodyParam, "Should have body parameter");
      ok(bodyParam.MethodParameterSegments, "Body parameter should have MethodParameterSegments");
      strictEqual(bodyParam.MethodParameterSegments.length, 2, "Should have 2 segments in path");
      strictEqual(bodyParam.MethodParameterSegments[0].Name, "params", "First segment should be 'params'");
      strictEqual(bodyParam.MethodParameterSegments[1].Name, "body", "Second segment should be 'body'");
    });

    it("should flow methodParameterSegments for mixed parameter types", async () => {
      const tsp = `
        @service
        namespace TestService;
        
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
        
        namespace Customizations;
        
        @route("/test/{pathParam}")
        @post op testOpCustomization(params: TestService.Params): void;
        
        @@override(TestService.testOp, Customizations.testOpCustomization);
      `;

      const runner = await createEmitterTestHost();
      const result = await runner.compile(tsp);
      
      ok(result.outputModel, "Output model should be generated");
      const clients = result.outputModel.Clients;
      ok(clients && clients.length > 0, "Should have at least one client");
      
      const operations = clients[0].Operations;
      ok(operations && operations.length > 0, "Should have operations");
      
      const testOp = operations.find(op => op.Name === "testOp");
      ok(testOp, "Should find testOp operation");
      
      const locations = ["Path", "Query", "Header", "Body"];
      for (const location of locations) {
        const param = testOp.Parameters.find(p => p.Location === location);
        ok(param, `Should have ${location} parameter`);
        ok(param.MethodParameterSegments, `${location} parameter should have MethodParameterSegments`);
        strictEqual(param.MethodParameterSegments.length, 2, `${location} parameter should have 2 segments`);
        strictEqual(param.MethodParameterSegments[0].Name, "params", `${location} parameter first segment should be 'params'`);
      }
    });

    it("should handle nested property access in methodParameterSegments", async () => {
      const tsp = `
        @service
        namespace TestService;
        
        model InnerModel {
          prop: string;
        }
        
        model Params {
          nested: InnerModel;
        }
        
        @route("/test")
        @post op testOp(@body nested: InnerModel): void;
        
        namespace Customizations;
        
        @route("/test")
        @post op testOpCustomization(params: TestService.Params): void;
        
        @@override(TestService.testOp, Customizations.testOpCustomization);
      `;

      const runner = await createEmitterTestHost();
      const result = await runner.compile(tsp);
      
      ok(result.outputModel, "Output model should be generated");
      const clients = result.outputModel.Clients;
      ok(clients && clients.length > 0, "Should have at least one client");
      
      const operations = clients[0].Operations;
      ok(operations && operations.length > 0, "Should have operations");
      
      const testOp = operations.find(op => op.Name === "testOp");
      ok(testOp, "Should find testOp operation");
      
      const bodyParam = testOp.Parameters.find(p => p.Location === "Body");
      ok(bodyParam, "Should have body parameter");
      ok(bodyParam.MethodParameterSegments, "Body parameter should have MethodParameterSegments");
      strictEqual(bodyParam.MethodParameterSegments.length, 2, "Should have 2 segments in path");
      strictEqual(bodyParam.MethodParameterSegments[0].Name, "params", "First segment should be 'params'");
      strictEqual(bodyParam.MethodParameterSegments[1].Name, "nested", "Second segment should be 'nested'");
    });
  });

  describe("operations without override decorator", () => {
    it("should not have methodParameterSegments", async () => {
      const tsp = `
        @service
        namespace TestService;
        
        @route("/test/{pathParam}")
        @get op testOp(@path pathParam: string, @query queryParam: string): void;
      `;

      const runner = await createEmitterTestHost();
      const result = await runner.compile(tsp);
      
      ok(result.outputModel, "Output model should be generated");
      const clients = result.outputModel.Clients;
      ok(clients && clients.length > 0, "Should have at least one client");
      
      const operations = clients[0].Operations;
      ok(operations && operations.length > 0, "Should have operations");
      
      const testOp = operations.find(op => op.Name === "testOp");
      ok(testOp, "Should find testOp operation");
      
      for (const param of testOp.Parameters) {
        strictEqual(param.MethodParameterSegments, undefined, 
          `Parameter ${param.Name} should not have MethodParameterSegments without override`);
      }
    });
  });

  describe("spread parameters with override", () => {
    it("should flow methodParameterSegments for spread body properties", async () => {
      const tsp = `
        @service
        namespace TestService;
        
        model SpreadModel {
          prop1: string;
          prop2: string;
        }
        
        @route("/test")
        @post op testOp(...SpreadModel): void;
        
        namespace Customizations;
        
        @route("/test")
        @post op testOpCustomization(params: TestService.SpreadModel): void;
        
        @@override(TestService.testOp, Customizations.testOpCustomization);
      `;

      const runner = await createEmitterTestHost();
      const result = await runner.compile(tsp);
      
      ok(result.outputModel, "Output model should be generated");
      const clients = result.outputModel.Clients;
      ok(clients && clients.length > 0, "Should have at least one client");
      
      const operations = clients[0].Operations;
      ok(operations && operations.length > 0, "Should have operations");
      
      const testOp = operations.find(op => op.Name === "testOp");
      ok(testOp, "Should find testOp operation");
      
      const bodyParams = testOp.Parameters.filter(p => p.Location === "Body");
      ok(bodyParams.length > 0, "Should have body parameters from spread");
      
      for (const param of bodyParams) {
        if (param.MethodParameterSegments) {
          strictEqual(param.MethodParameterSegments.length, 2, 
            `Spread parameter ${param.Name} should have 2 segments`);
          strictEqual(param.MethodParameterSegments[0].Name, "params", 
            `Spread parameter ${param.Name} first segment should be 'params'`);
        }
      }
    });
  });
});

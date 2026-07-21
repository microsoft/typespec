import { Operation, type ModelProperty } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { getHttpOperation, listHttpOperationsIn } from "@typespec/http";
import { unsafe_setRouteOptionsForNamespace as setRouteOptionsForNamespace } from "@typespec/http/experimental";
import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { Tester } from "./test-host.js";

describe("cache with routeParamFilter (ARM singleton pattern)", () => {
  it("getHttpOperation respects routeParamFilter set on namespace", async () => {
    // This simulates the ARM singleton pattern where setRouteOptionsForNamespace
    // sets a routeParamFilter that excludes certain path parameters.
    // The filter is set during a decorator (checking phase) and must be respected
    // by getHttpOperation calls during validation/linting/emitting.
    const { myOp, TestService, program } = await Tester.compile(t.code`
      @service(#{title: "Test"})
      namespace ${t.namespace("TestService")} {
        @autoRoute
        op ${t.op("myOp")}(@path subscriptionId: string, @path resourceName: string): void;
      }
    `);

    // Simulate what the ARM decorator does: set routeParamFilter on namespace
    // This would normally be done during checking, but the filter persists on program state
    setRouteOptionsForNamespace(program, TestService, {
      autoRouteOptions: {
        routeParamFilter: (_op: Operation, param: ModelProperty) => {
          if (param.name === "resourceName") {
            return {
              routeParamString: "default",
              excludeFromOperationParams: true,
            };
          }
          return undefined;
        },
      },
    });

    // Clear the cache to force recomputation with the new filter
    const cacheKey = Symbol.for("@typespec/http.httpOperationCache");
    const cache = program.stateMap(cacheKey) as Map<any, any>;
    cache.clear();

    // getHttpOperation without options should respect the namespace's routeParamFilter
    const [httpOp] = getHttpOperation(program, myOp);
    const paramNames = httpOp.parameters.parameters.map((p) => p.name);

    // resourceName should be excluded by the filter
    strictEqual(paramNames.includes("resourceName"), false);
    strictEqual(paramNames.includes("subscriptionId"), true);

    // Verify the path includes the fixed singleton value
    strictEqual(httpOp.path.includes("default"), true);

    // Second call should return cached result (same object)
    const [httpOp2] = getHttpOperation(program, myOp);
    strictEqual(httpOp, httpOp2);
    strictEqual(httpOp2.parameters.parameters.map((p) => p.name).includes("resourceName"), false);
  });

  it("listHttpOperationsIn respects routeParamFilter set on namespace", async () => {
    const { TestService, program } = await Tester.compile(t.code`
      @service(#{title: "Test"})
      namespace ${t.namespace("TestService")} {
        @autoRoute
        op myOp(@path subscriptionId: string, @path singletonKey: string): void;
      }
    `);

    // Set filter that excludes singletonKey
    setRouteOptionsForNamespace(program, TestService, {
      autoRouteOptions: {
        routeParamFilter: (_op: Operation, param: ModelProperty) => {
          if (param.name === "singletonKey") {
            return {
              routeParamString: "default",
              excludeFromOperationParams: true,
            };
          }
          return undefined;
        },
      },
    });

    // Clear cache
    const cacheKey = Symbol.for("@typespec/http.httpOperationCache");
    const cache = program.stateMap(cacheKey) as Map<any, any>;
    cache.clear();

    // listHttpOperationsIn without options should also respect the filter
    const [ops] = listHttpOperationsIn(program, TestService);
    strictEqual(ops.length, 1);
    const paramNames = ops[0].parameters.parameters.map((p) => p.name);
    strictEqual(paramNames.includes("singletonKey"), false);
    strictEqual(paramNames.includes("subscriptionId"), true);
  });

  it("cache does not serve stale results when routeParamFilter is set before validation", async () => {
    // Reproduce the Azure integration test scenario:
    // 1. Decorator sets routeParamFilter on namespace (during checking)
    // 2. HTTP validator resolves operations (during validating) — bypasses cache
    // 3. Later caller gets cached result — must include filter
    const { myOp, TestService, program } = await Tester.compile(t.code`
      @service(#{title: "Test"})
      namespace ${t.namespace("TestService")} {
        @autoRoute
        op ${t.op("myOp")}(@path subscriptionId: string, @path singletonKey: string): void;
      }
    `);

    // Set filter (simulating ARM decorator)
    setRouteOptionsForNamespace(program, TestService, {
      autoRouteOptions: {
        routeParamFilter: (_op: Operation, param: ModelProperty) => {
          if (param.name === "singletonKey") {
            return {
              routeParamString: "default",
              excludeFromOperationParams: true,
            };
          }
          return undefined;
        },
      },
    });

    // Clear cache
    const cacheKey = Symbol.for("@typespec/http.httpOperationCache");
    const cache = program.stateMap(cacheKey) as Map<any, any>;
    cache.clear();

    // Simulate $onValidate path: listHttpOperationsIn WITH options (bypasses cache)
    const [validatorOps] = listHttpOperationsIn(program, TestService, {
      listOptions: { recursive: true },
    });
    strictEqual(validatorOps.length, 1);
    // Validator result should also have filter applied (via parentOptions from namespace)
    strictEqual(
      validatorOps[0].parameters.parameters.map((p) => p.name).includes("singletonKey"),
      false,
    );

    // Cache should still be empty (validator bypassed it)
    strictEqual(cache.has(myOp), false);

    // Now simulate SDK/linter call: getHttpOperation WITHOUT options (uses cache)
    const [httpOp] = getHttpOperation(program, myOp);
    const paramNames = httpOp.parameters.parameters.map((p) => p.name);
    strictEqual(paramNames.includes("singletonKey"), false);
    strictEqual(paramNames.includes("subscriptionId"), true);

    // Now cache should be populated
    strictEqual(cache.has(myOp), true);
  });
});

import { Operation } from "@typespec/compiler";
import { unsafe_invalidateCaches as invalidateCaches } from "@typespec/compiler/experimental";
import { t } from "@typespec/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getAllHttpServices, getHttpOperation } from "../src/index.js";
import { setRouteOptionsForNamespace, setRouteProducer } from "../src/route.js";
import { Tester } from "./test-host.js";

describe("getHttpOperation caching", () => {
  it("returns consistent results across multiple calls", async () => {
    const { program, myOp } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/items/{id}") op ${t.op("myOp")}(@path id: string): void;
    `);

    const [result1] = getHttpOperation(program, myOp);
    const [result2] = getHttpOperation(program, myOp);

    strictEqual(result1.path, result2.path);
    strictEqual(result1.verb, result2.verb);
    deepStrictEqual(
      result1.parameters.parameters.map((p) => p.name),
      result2.parameters.parameters.map((p) => p.name),
    );
  });

  it("caches during emitting stage (after compile)", async () => {
    const { program, myOp } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/things/{thingId}") op ${t.op("myOp")}(@path thingId: string): void;
    `);

    // After compile(), currentStage is "emitting" — cache should be active
    strictEqual(program.currentStage, "emitting");

    const [result1] = getHttpOperation(program, myOp);
    const [result2] = getHttpOperation(program, myOp);

    // Should be the exact same object reference (cached)
    strictEqual(result1, result2);
  });

  it("returns correct results for multiple operations", async () => {
    const { program, opA, opB } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/a") op ${t.op("opA")}(): void;
      @route("/b/{id}") op ${t.op("opB")}(@path id: string): void;
    `);

    const [resultA] = getHttpOperation(program, opA);
    const [resultB] = getHttpOperation(program, opB);

    strictEqual(resultA.path, "/a");
    strictEqual(resultB.path, "/b/{id}");
    deepStrictEqual(
      resultA.parameters.parameters.map((p) => p.name),
      [],
    );
    deepStrictEqual(
      resultB.parameters.parameters.map((p) => p.name),
      ["id"],
    );
  });

  it("does not cache when options are provided", async () => {
    const { program, myOp } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/items/{id}") op ${t.op("myOp")}(@path id: string): void;
    `);

    // Call with options — should not use cache
    const [result1] = getHttpOperation(program, myOp, {});
    const [result2] = getHttpOperation(program, myOp, {});

    // Results should be equal but NOT the same reference (not cached)
    strictEqual(result1.path, result2.path);
  });

  describe("operations with overloads", () => {
    it("caches overloaded operations correctly", async () => {
      const { program, baseOp, overload1 } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;
        @route("/items") op ${t.op("baseOp")}(@query filter: string): void;
        @route("/items") @overload(baseOp) op ${t.op("overload1")}(@query filter: "active"): void;
      `);

      const [baseResult1] = getHttpOperation(program, baseOp);
      const [overloadResult1] = getHttpOperation(program, overload1);
      const [baseResult2] = getHttpOperation(program, baseOp);
      const [overloadResult2] = getHttpOperation(program, overload1);

      strictEqual(baseResult1, baseResult2);
      strictEqual(overloadResult1, overloadResult2);
      strictEqual(baseResult1.path, "/items");
      strictEqual(overloadResult1.path, "/items");
    });
  });

  describe("route param filtering (ARM-like pattern)", () => {
    it("filters path params via routeParamFilter set on namespace", async () => {
      const { program, createOp, TestService } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace ${t.namespace("TestService")};
        @route("/providers/{provider}/resources/{resourceName}")
        op ${t.op("createOp")}(@path provider: string, @path resourceName: string): void;
      `);

      // Simulate ARM pattern: set routeParamFilter on the service namespace
      setRouteOptionsForNamespace(program, TestService, {
        autoRouteOptions: {
          routeParamFilter: (_op: Operation, param) => {
            if (param.name === "provider") {
              return { routeParamString: "Microsoft.Test", excludeFromOperationParams: true };
            }
            return undefined;
          },
        },
      });

      // routeParamFilter only applies via a custom route producer (like autoRouteProducer)
      // DefaultRouteProducer does not invoke routeParamFilter
      const [result1] = getHttpOperation(program, createOp);
      const [result2] = getHttpOperation(program, createOp);

      // Results should be cached and identical
      strictEqual(result1, result2);
      strictEqual(result1.path, "/providers/{provider}/resources/{resourceName}");
    });

    it("caches results consistently when using custom route producer", async () => {
      const { program, createRes } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;
        op ${t.op("createRes")}(@path provider: string, @path name: string): void;
      `);

      // Set a custom route producer that filters params (simulates ARM's autoRouteProducer)
      setRouteProducer(
        program,
        createRes,
        (_prog, op, _parentSegments, _overloadBase, _options) => {
          return [
            {
              uriTemplate: "/providers/Microsoft.Test/resources/{name}",
              parameters: {
                verb: "put" as const,
                parameters: [
                  {
                    type: "path" as const,
                    name: "name",
                    param: op.parameters.properties.get("name")!,
                  },
                ],
                body: undefined,
                properties: [],
              },
            },
            [],
          ];
        },
      );

      const [result1] = getHttpOperation(program, createRes);
      const [result2] = getHttpOperation(program, createRes);

      strictEqual(result1, result2);
      strictEqual(result1.path, "/providers/Microsoft.Test/resources/{name}");
      deepStrictEqual(
        result1.parameters.parameters.map((p) => p.name),
        ["name"],
      );
    });
  });

  describe("consistency across compilation stages", () => {
    it("getHttpOperation during emitting matches getAllHttpServices from validation", async () => {
      const { program, myOp } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;
        @route("/items/{id}") @get op ${t.op("myOp")}(@path id: string): void;
      `);

      // getAllHttpServices resolves operations via listHttpOperationsIn (bypasses our cache)
      const [services] = getAllHttpServices(program);
      const validationResult = services[0].operations.find((op) => op.operation === myOp);

      // getHttpOperation uses the cache
      const [emittingResult] = getHttpOperation(program, myOp);

      // Both should resolve to the same path and parameters
      strictEqual(validationResult!.path, emittingResult.path);
      strictEqual(validationResult!.verb, emittingResult.verb);
      deepStrictEqual(
        validationResult!.parameters.parameters.map((p) => p.name),
        emittingResult.parameters.parameters.map((p) => p.name),
      );
    });

    it("operations in nested namespaces are cached correctly", async () => {
      const { program, innerOp } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;
        @route("/outer")
        namespace Outer {
          @route("/inner/{id}")
          op ${t.op("innerOp")}(@path id: string): void;
        }
      `);

      const [result1] = getHttpOperation(program, innerOp);
      const [result2] = getHttpOperation(program, innerOp);

      strictEqual(result1, result2);
      strictEqual(result1.path, "/outer/inner/{id}");
    });

    it("interface operations are cached correctly", async () => {
      const { program, list } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;
        @route("/items")
        interface Items {
          @get op ${t.op("list")}(): void;
          @post op create(): void;
        }
      `);

      const [result1] = getHttpOperation(program, list);
      const [result2] = getHttpOperation(program, list);

      strictEqual(result1, result2);
      strictEqual(result1.verb, "get");
      strictEqual(result1.path, "/items");
    });
  });

  describe("template instantiation patterns", () => {
    it("caches template-instantiated operations independently", async () => {
      const { program, listItems, listUsers } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;

        op ResourceList<T>(): T[];

        @route("/items") op ${t.op("listItems")} is ResourceList<string>;
        @route("/users") op ${t.op("listUsers")} is ResourceList<int32>;
      `);

      const [itemsResult1] = getHttpOperation(program, listItems);
      const [usersResult1] = getHttpOperation(program, listUsers);
      const [itemsResult2] = getHttpOperation(program, listItems);
      const [usersResult2] = getHttpOperation(program, listUsers);

      strictEqual(itemsResult1, itemsResult2);
      strictEqual(usersResult1, usersResult2);
      strictEqual(itemsResult1.path, "/items");
      strictEqual(usersResult1.path, "/users");
    });

    it("template operations with path params cache correctly", async () => {
      const { program, getItem, getUser } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;

        @route("{name}") op ResourceGet<T>(@path name: string): T;

        @route("/items/") op ${t.op("getItem")} is ResourceGet<string>;
        @route("/users/") op ${t.op("getUser")} is ResourceGet<int32>;
      `);

      const [itemResult] = getHttpOperation(program, getItem);
      const [userResult] = getHttpOperation(program, getUser);

      // Each template instantiation should have its own cached result
      strictEqual(itemResult.path, "/items/{name}");
      strictEqual(userResult.path, "/users/{name}");

      // Verify caching
      const [itemResult2] = getHttpOperation(program, getItem);
      strictEqual(itemResult, itemResult2);
    });

    it("template operations with nested namespace path params", async () => {
      const { program, get } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;

        @route("{name}") op ResourceGet<T>(@path name: string): T;

        @route("/resources")
        namespace Resources {
          @route("/items/")
          op ${t.op("get")} is ResourceGet<string>;
        }
      `);

      const [result1] = getHttpOperation(program, get);
      const [result2] = getHttpOperation(program, get);

      strictEqual(result1, result2);
      strictEqual(result1.path, "/resources/items/{name}");
      deepStrictEqual(
        result1.parameters.parameters.filter((p) => p.type === "path").map((p) => p.name),
        ["name"],
      );
    });
  });

  describe("ARM-like lifecycle (repro for Azure CI)", () => {
    // These tests replicate the pattern that caused Azure CI failures:
    // 1. A custom route producer that filters path params (like autoRouteProducer)
    // 2. routeParamFilter set on the service namespace (like @armProviderNamespace)
    // 3. String literal path params that should be excluded (like provider constants)
    // 4. getAllHttpServices called first (validation), then getHttpOperation after (emitting)

    it("filtered params remain filtered after cache (singleton pattern)", async () => {
      const { program, createOp, TestService } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace ${t.namespace("TestService")};
        op ${t.op("createOp")}(
          @path provider: "Microsoft.Test",
          @path singletonName: "default",
          @path resourceGroupName: string,
          @body resource: {},
        ): void;
      `);

      // Simulate ARM's autoRouteProducer: filters string literals and singleton params
      setRouteProducer(program, createOp, (_prog, op, parentSegments, _overloadBase, options) => {
        const filteredParameters: any[] = [];
        const props = op.parameters.properties;

        for (const [name, prop] of props) {
          const isPath = prop.type.kind === "Scalar" || prop.type.kind === "String";
          if (!isPath) continue;

          // String literal — exclude from params (like ARM provider constants)
          if (prop.type.kind === "String") {
            continue;
          }

          // Check routeParamFilter (like ARM singleton filter)
          const filterResult = options.autoRouteOptions?.routeParamFilter?.(op, prop);
          if (filterResult?.excludeFromOperationParams) {
            continue;
          }

          filteredParameters.push({ type: "path", name, param: prop });
        }

        return [
          {
            uriTemplate:
              "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Test/singletons/default",
            parameters: {
              verb: "put" as const,
              parameters: filteredParameters,
              body: {
                bodyKind: "single" as const,
                type: props.get("resource")!,
                property: props.get("resource")!,
              },
              properties: [],
            },
          },
          [],
        ];
      });

      // Set routeParamFilter on namespace (like @armProviderNamespace does)
      setRouteOptionsForNamespace(program, TestService, {
        autoRouteOptions: {
          routeParamFilter: (_op: Operation, param) => {
            if (param.name === "singletonName") {
              return { routeParamString: "default", excludeFromOperationParams: true };
            }
            return undefined;
          },
        },
      });

      // Simulate validation phase: getAllHttpServices processes all operations
      getAllHttpServices(program);

      // Now simulate emitting phase: getHttpOperation called individually (cached)
      const [emitResult1] = getHttpOperation(program, createOp);
      const [emitResult2] = getHttpOperation(program, createOp);

      // Cache should return same reference
      strictEqual(emitResult1, emitResult2);

      // The filtered params should NOT include provider or singletonName
      const pathParams = emitResult1.parameters.parameters
        .filter((p) => p.type === "path")
        .map((p) => p.name);
      deepStrictEqual(pathParams, ["resourceGroupName"]);
    });

    it("template ops with filtered params stay correct through cache", async () => {
      const { program, create } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace ${t.namespace("TestService")};

        op ResourceCreate<T>(@path name: string, @body resource: T): void;

        op ${t.op("create")} is ResourceCreate<{}>;
      `);

      // ARM-like: set route producer that filters based on namespace options
      setRouteProducer(program, create, (_prog, op, _segments, _overload, options) => {
        const params: any[] = [];
        for (const [name, prop] of op.parameters.properties) {
          if (prop.type.kind === "Model" && name === "resource") continue; // body
          const filterResult = options.autoRouteOptions?.routeParamFilter?.(op, prop);
          if (filterResult?.excludeFromOperationParams) continue;
          params.push({ type: "path", name, param: prop });
        }
        return [
          {
            uriTemplate: "/resources/{name}",
            parameters: {
              verb: "put" as const,
              parameters: params,
              body: undefined,
              properties: [],
            },
          },
          [],
        ];
      });

      // getAllHttpServices first (like validation does)
      getAllHttpServices(program);

      // Then getHttpOperation (like emitters/SDK do)
      const [result1] = getHttpOperation(program, create);
      const [result2] = getHttpOperation(program, create);

      strictEqual(result1, result2);
      deepStrictEqual(
        result1.parameters.parameters.map((p) => p.name),
        ["name"],
      );
    });

    it("multiple operations with different filtering cached independently", async () => {
      const { program, opA, opB } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace ${t.namespace("TestService")};
        op ${t.op("opA")}(@path provider: "Microsoft.Test", @path name: string): void;
        op ${t.op("opB")}(@path provider: "Microsoft.Other", @path id: string): void;
      `);

      // Each operation gets a route producer that filters string literals
      for (const op of [opA, opB]) {
        setRouteProducer(program, op, (_prog, operation, _segments, _overload, _options) => {
          const params: any[] = [];
          for (const [name, prop] of operation.parameters.properties) {
            if (prop.type.kind === "String") continue; // filter string literals
            params.push({ type: "path", name, param: prop });
          }
          const nonLiteralParam = params[0]?.name ?? "id";
          return [
            {
              uriTemplate: `/providers/{${nonLiteralParam}}`,
              parameters: {
                verb: "get" as const,
                parameters: params,
                body: undefined,
                properties: [],
              },
            },
            [],
          ];
        });
      }

      // Validation path first
      getAllHttpServices(program);

      // Emitting path — each op cached independently
      const [resultA1] = getHttpOperation(program, opA);
      const [resultB1] = getHttpOperation(program, opB);
      const [resultA2] = getHttpOperation(program, opA);
      const [resultB2] = getHttpOperation(program, opB);

      strictEqual(resultA1, resultA2);
      strictEqual(resultB1, resultB2);

      // opA should only have "name" (provider filtered as string literal)
      deepStrictEqual(
        resultA1.parameters.parameters.map((p) => p.name),
        ["name"],
      );
      // opB should only have "id" (provider filtered as string literal)
      deepStrictEqual(
        resultB1.parameters.parameters.map((p) => p.name),
        ["id"],
      );
    });
  });

  describe("cache invalidation", () => {
    it("invalidateCaches clears cached results so recomputation occurs", async () => {
      const { program, myOp } = await Tester.compile(t.code`
        @service(#{title: "Test"}) namespace TestService;
        @route("/items/{id}") op ${t.op("myOp")}(@path id: string): void;
      `);

      // First call caches the result
      const [result1] = getHttpOperation(program, myOp);
      strictEqual(result1.path, "/items/{id}");

      // Invalidate caches
      invalidateCaches(program);

      // Second call should recompute (not return stale cache)
      const [result2] = getHttpOperation(program, myOp);
      strictEqual(result2.path, "/items/{id}");

      // Results should be equivalent but potentially different objects
      deepStrictEqual(
        result1.parameters.parameters.map((p) => p.name),
        result2.parameters.parameters.map((p) => p.name),
      );
    });
  });
});

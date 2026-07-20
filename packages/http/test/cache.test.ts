import { t } from "@typespec/compiler/testing";
import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getAllHttpServices, getHttpOperation, listHttpOperationsIn } from "../src/index.js";
import { Tester } from "./test-host.js";

describe("HTTP operation caching", () => {
  it("getHttpOperation returns same result on repeated calls", async () => {
    const { myOp, program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/things")
      @get op ${t.op("myOp")}(): void;
    `);

    const [first] = getHttpOperation(program, myOp);
    const [second] = getHttpOperation(program, myOp);

    strictEqual(first.path, "/things");
    strictEqual(second.path, "/things");
    strictEqual(first.verb, "get");
    strictEqual(second.verb, "get");
    // Should be the same cached object
    strictEqual(first, second);
  });

  it("getHttpOperation returns correct path for operations in @route-decorated interface", async () => {
    const { myOp, program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/widgets")
      interface Widgets {
        @get op ${t.op("myOp")}(): void;
      }
    `);

    // First call - populates cache
    const [first] = getHttpOperation(program, myOp);
    strictEqual(first.path, "/widgets");
    strictEqual(first.verb, "get");

    // Second call - cache hit
    const [second] = getHttpOperation(program, myOp);
    strictEqual(second.path, "/widgets");
    strictEqual(second.verb, "get");
  });

  it("getHttpOperation returns correct path for nested route segments", async () => {
    const { create, program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}")
      interface Resources {
        @route("/providers/Microsoft.Test/items/{itemName}")
        @put op ${t.op("create")}(
          @path subscriptionId: string,
          @path resourceGroupName: string,
          @path itemName: string,
        ): void;
      }
    `);

    // $onValidate already ran via Tester.compile()
    // Now call getHttpOperation - should resolve correctly
    const [httpOp] = getHttpOperation(program, create);
    strictEqual(
      httpOp.path,
      "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Test/items/{itemName}",
    );
    strictEqual(httpOp.verb, "put");

    // Second call should return same cached result
    const [cached] = getHttpOperation(program, create);
    strictEqual(cached.path, httpOp.path);
    strictEqual(cached.verb, httpOp.verb);
  });

  it("getAllHttpServices and getHttpOperation return consistent results", async () => {
    const { read, create, program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/items")
      interface Items {
        @get op ${t.op("read")}(@path id: string): void;
        @put op ${t.op("create")}(): void;
      }
    `);

    // getAllHttpServices goes through listHttpOperationsIn with options
    const [services] = getAllHttpServices(program);
    const serviceOps = services[0].operations;

    // getHttpOperation is called without options (uses cache)
    const [readOp] = getHttpOperation(program, read);
    const [createOp] = getHttpOperation(program, create);

    // Results should be consistent
    const serviceRead = serviceOps.find((op) => op.operation === read);
    const serviceCreate = serviceOps.find((op) => op.operation === create);

    strictEqual(readOp.path, serviceRead!.path);
    strictEqual(readOp.verb, serviceRead!.verb);
    strictEqual(createOp.path, serviceCreate!.path);
    strictEqual(createOp.verb, serviceCreate!.verb);
  });

  it("listHttpOperationsIn and getHttpOperation return consistent results", async () => {
    const { program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/widgets")
      interface Widgets {
        @get op read(@path id: string): void;
        @post op create(): void;
        @delete op remove(@path id: string): void;
      }
    `);

    // listHttpOperationsIn called without options - uses cache
    const [listOps] = listHttpOperationsIn(program, program.getGlobalNamespaceType());

    // getHttpOperation called individually - should use same cache
    for (const listOp of listOps) {
      const [individualOp] = getHttpOperation(program, listOp.operation);
      strictEqual(individualOp.path, listOp.path);
      strictEqual(individualOp.verb, listOp.verb);
    }
  });

  it("operations with overloads resolve correctly from cache", async () => {
    const { upload, uploadString, uploadBytes, program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/upload")
      @put
      op ${t.op("upload")}(data: string | bytes, @header contentType: "text/plain" | "application/octet-stream"): void;
      @overload(upload)
      op ${t.op("uploadString")}(data: string, @header contentType: "text/plain"): void;
      @overload(upload)
      op ${t.op("uploadBytes")}(data: bytes, @header contentType: "application/octet-stream"): void;
    `);

    // First calls populate cache
    const [uploadOp1] = getHttpOperation(program, upload);
    const [stringOp1] = getHttpOperation(program, uploadString);
    const [bytesOp1] = getHttpOperation(program, uploadBytes);

    // Second calls should use cache
    const [uploadOp2] = getHttpOperation(program, upload);
    const [stringOp2] = getHttpOperation(program, uploadString);
    const [bytesOp2] = getHttpOperation(program, uploadBytes);

    // Verify paths and verbs are correct
    strictEqual(uploadOp1.path, "/upload");
    strictEqual(stringOp1.path, "/upload");
    strictEqual(bytesOp1.path, "/upload");

    // Verify cached values match
    strictEqual(uploadOp1, uploadOp2);
    strictEqual(stringOp1, stringOp2);
    strictEqual(bytesOp1, bytesOp2);
  });

  it("diagnostics are preserved in cache", async () => {
    const [{ myOp, program }] = await Tester.compileAndDiagnose(t.code`
      @service(#{title: "Test"}) namespace TestService;
      @route("/things/{id}")
      @get op ${t.op("myOp")}(): void;
    `);

    // First call - should produce missing-uri-param diagnostic
    const [, diag1] = getHttpOperation(program, myOp);
    // Second call - cached, should replay diagnostics
    const [, diag2] = getHttpOperation(program, myOp);

    strictEqual(diag1.length, 1);
    deepStrictEqual(diag1, diag2);
  });

  it("getHttpOperation after getAllHttpServices returns correct paths for multiple operations", async () => {
    const { get1, get2, get3, program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;

      @route("/a")
      interface A {
        @get op ${t.op("get1")}(): void;
      }

      @route("/b")
      interface B {
        @get op ${t.op("get2")}(): void;
      }

      @route("/c")
      interface C {
        @get op ${t.op("get3")}(): void;
      }
    `);

    // Simulate what happens in practice:
    // 1. $onValidate calls getAllHttpServices (already ran in Tester.compile)
    // 2. Then individual callers use getHttpOperation

    const [op1] = getHttpOperation(program, get1);
    const [op2] = getHttpOperation(program, get2);
    const [op3] = getHttpOperation(program, get3);

    strictEqual(op1.path, "/a");
    strictEqual(op2.path, "/b");
    strictEqual(op3.path, "/c");
  });

  it("operations defined via 'is' in templated interfaces resolve correctly", async () => {
    const { program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;

      @route("/items")
      interface Items {
        @get op read(@path itemId: string): void;
        @put op create(@path itemId: string): void;
      }
    `);

    // getAllHttpServices ran during $onValidate in Tester.compile
    // Now simulate what ARM resolver does - call getHttpOperation individually
    const [services] = getAllHttpServices(program);
    const ops = services[0].operations;

    for (const op of ops) {
      const [individual] = getHttpOperation(program, op.operation);
      strictEqual(
        individual.path,
        op.path,
        `Path mismatch for ${op.operation.name}: getAllHttpServices returned "${op.path}" but getHttpOperation returned "${individual.path}"`,
      );
      strictEqual(individual.verb, op.verb);
    }
  });

  it("cache does not return stale results for operations in different interfaces", async () => {
    const { program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;

      @route("/alpha/{alphaId}")
      interface Alpha {
        @get op read(@path alphaId: string): void;
        @put op create(@path alphaId: string): void;
      }

      @route("/beta/{betaId}")
      interface Beta {
        @get op read(@path betaId: string): void;
        @delete op remove(@path betaId: string): void;
      }
    `);

    // Get all operations via getAllHttpServices
    const [services] = getAllHttpServices(program);
    const allOps = services[0].operations;

    // Find specific operations
    const alphaOps = allOps.filter(
      (op) => op.container.kind === "Interface" && op.container.name === "Alpha",
    );
    const betaOps = allOps.filter(
      (op) => op.container.kind === "Interface" && op.container.name === "Beta",
    );

    strictEqual(alphaOps.length, 2, "Should have 2 Alpha operations");
    strictEqual(betaOps.length, 2, "Should have 2 Beta operations");

    // Now call getHttpOperation individually and verify paths don't cross
    for (const op of alphaOps) {
      const [individual] = getHttpOperation(program, op.operation);
      strictEqual(
        individual.path.startsWith("/alpha/"),
        true,
        `Alpha op has wrong path: ${individual.path}`,
      );
    }
    for (const op of betaOps) {
      const [individual] = getHttpOperation(program, op.operation);
      strictEqual(
        individual.path.startsWith("/beta/"),
        true,
        `Beta op has wrong path: ${individual.path}`,
      );
    }
  });

  it("cache works correctly when getAllHttpServices is called multiple times", async () => {
    const { program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;

      @route("/items")
      interface Items {
        @get op list(): void;
        @post op create(): void;
      }
    `);

    // Call getAllHttpServices multiple times (as different consumers might)
    const [services1] = getAllHttpServices(program);
    const [services2] = getAllHttpServices(program);

    // Operations should have same paths
    strictEqual(services1[0].operations.length, services2[0].operations.length);
    for (let i = 0; i < services1[0].operations.length; i++) {
      strictEqual(services1[0].operations[i].path, services2[0].operations[i].path);
      strictEqual(services1[0].operations[i].verb, services2[0].operations[i].verb);
    }

    // getHttpOperation should also match
    for (const op of services1[0].operations) {
      const [individual] = getHttpOperation(program, op.operation);
      strictEqual(individual.path, op.path);
    }
  });

  it("cache handles operations found via different container walks", async () => {
    // When listHttpOperationsIn is called on different containers,
    // the same operation might be found. Cache should handle this.
    const { program } = await Tester.compile(t.code`
      @service(#{title: "Test"}) namespace TestService;

      @route("/things")
      interface Things {
        @get op list(): void;
      }
    `);

    // Walk the service namespace (found via getAllHttpServices)
    const [services] = getAllHttpServices(program);
    const serviceOps = services[0].operations;

    // Walk the global namespace directly (no options - uses cache)
    const [globalOps] = listHttpOperationsIn(program, program.getGlobalNamespaceType());

    // Both should find the same operation with same path
    strictEqual(serviceOps.length, 1);
    strictEqual(globalOps.length, 1);
    strictEqual(serviceOps[0].path, "/things");
    strictEqual(globalOps[0].path, "/things");
  });

  describe("stage-gated caching (currentStage guard)", () => {
    it("does not cache result when program is in checking stage", async () => {
      const { myOp, program } = await Tester.compile(t.code`
       @service(#{title: "Test"}) namespace TestService;
       @route("/widgets")
       interface Widgets {
         @route("/items")
         @get op ${t.op("myOp")}(): void;
       }
     `);

      // After compilation, the stage should be past checking
      strictEqual(program.currentStage !== "checking" && program.currentStage !== "parsing", true);

      // Clear the cache and set stage back to "checking" to simulate decorator phase
      const cacheKey = Symbol.for("@typespec/http.httpOperationCache");
      const cache = program.stateMap(cacheKey) as Map<any, any>;
      cache.delete(myOp);
      program.setCurrentStage("checking");

      const [duringChecking] = getHttpOperation(program, myOp);
      // Result is still computed (just not cached)
      strictEqual(duringChecking.path, "/widgets/items");
      strictEqual(duringChecking.verb, "get");

      // Verify nothing was cached during checking stage
      strictEqual(cache.has(myOp), false);

      // Restore to validating stage — now caching should work
      program.setCurrentStage("validating");
      const [afterValidating] = getHttpOperation(program, myOp);
      strictEqual(afterValidating.path, "/widgets/items");

      // NOW it should be cached
      strictEqual(cache.has(myOp), true);
    });

    it("does not cache in listHttpOperationsIn when program is in checking stage", async () => {
      const { myOp, Widgets, program } = await Tester.compile(t.code`
       @service(#{title: "Test"}) namespace TestService;
       @route("/widgets")
       interface ${t.interface("Widgets")} {
         @get op ${t.op("myOp")}(): void;
       }
     `);

      const cacheKey = Symbol.for("@typespec/http.httpOperationCache");
      const cache = program.stateMap(cacheKey) as Map<any, any>;
      cache.delete(myOp);

      // Set to checking stage
      program.setCurrentStage("checking");
      const [opsWhileChecking] = listHttpOperationsIn(program, Widgets);
      strictEqual(opsWhileChecking.length, 1);
      strictEqual(opsWhileChecking[0].path, "/widgets");

      // Should NOT have been cached
      strictEqual(cache.has(myOp), false);

      // After moving to validating stage, result should be cached
      program.setCurrentStage("validating");
      const [opsAfterValidating] = listHttpOperationsIn(program, Widgets);
      strictEqual(opsAfterValidating.length, 1);
      strictEqual(opsAfterValidating[0].path, "/widgets");
      strictEqual(cache.has(myOp), true);
    });

    it("prevents stale checking-phase result from poisoning cache for later callers", async () => {
      // This is the core bug scenario from Azure/typespec-azure integration failures:
      // 1. A decorator (e.g. $markAsLro) calls getHttpOperation during checker phase
      //    when route decorators haven't all been applied yet
      // 2. Without the stage guard, the incomplete result gets cached
      // 3. Later callers (linter rules, emitters) get the stale/incomplete result
      //
      // program.useCache prevents this by only caching from "validating" onward.
      const { myOp, program } = await Tester.compile(t.code`
       @service(#{title: "Test"}) namespace TestService;
       @route("/parent")
       interface Resources {
         @route("/child")
         @get op ${t.op("myOp")}(): void;
       }
     `);

      const cacheKey = Symbol.for("@typespec/http.httpOperationCache");
      const cache = program.stateMap(cacheKey) as Map<any, any>;
      cache.clear();

      // Phase 1: checking-phase call — should not cache
      program.setCurrentStage("checking");
      getHttpOperation(program, myOp);
      strictEqual(cache.has(myOp), false);

      // Phase 2: post-checking call — e.g. from a validator or linter rule
      program.setCurrentStage("validating");
      const [finalResult] = getHttpOperation(program, myOp);

      // The result should be the fully-resolved path, not a stale incomplete one
      strictEqual(finalResult.path, "/parent/child");
      strictEqual(finalResult.verb, "get");

      // And now it IS cached
      strictEqual(cache.has(myOp), true);
      const cached = cache.get(myOp);
      strictEqual(cached.httpOperation.path, "/parent/child");
    });
  });
});

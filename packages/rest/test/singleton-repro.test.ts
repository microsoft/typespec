import { describe, it } from "vitest";
import { deepStrictEqual, strictEqual } from "assert";
import { ModelProperty, Operation } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { getHttpOperation, getAllHttpServices } from "@typespec/http";
import { unsafe_setRouteOptionsForNamespace as setRouteOptionsForNamespace } from "@typespec/http/experimental";
import { Tester } from "./test-host.js";

/**
 * These tests reproduce the ARM singleton resource pattern where:
 * 1. routeParamFilter is set on a namespace (like @armProviderNamespace does)
 * 2. @autoRoute is used on operations (like @armResourceOperations does)
 * 3. String literal path params and filtered params should be excluded from the operation params
 *
 * This ensures getHttpOperation correctly applies autoRouteProducer filtering
 * regardless of the compilation stage when called.
 */

function armStyleRouteParamFilter(_op: Operation, param: ModelProperty) {
  if (param.name === "provider") {
    return { routeParamString: "Microsoft.Test", excludeFromOperationParams: true };
  }
  if (param.name === "singletonName") {
    return { routeParamString: "default", excludeFromOperationParams: true };
  }
  return undefined;
}

const singletonCode = t.code`
  @service(#{title: "Test"})
  namespace TestService;

  @autoRoute
  interface Singleton {
    @put op ${t.op("myOp")}(
      @path @segment("subscriptions") subscriptionId: string,
      @path @segment("resourceGroups") resourceGroupName: string,
      @path @segment("providers") provider: "Microsoft.Test",
      @path @segment("singletons") singletonName: "default",
      @body resource: { name: string },
    ): { name: string };
  }
`;

describe("ARM singleton pattern - routeParamFilter on namespace", () => {
  it("compile() sets currentStage to emitting", async () => {
    const { program } = await Tester.compile(singletonCode);
    strictEqual(program.currentStage, "emitting");
  });

  it("filters params via routeParamFilter set on namespace", async () => {
    const { myOp, program } = await Tester.compile(singletonCode);

    const globalNs = program.getGlobalNamespaceType();
    setRouteOptionsForNamespace(program, globalNs, {
      autoRouteOptions: { routeParamFilter: armStyleRouteParamFilter },
    });

    const [httpOp] = getHttpOperation(program, myOp);

    const pathParamNames = httpOp.parameters.parameters
      .filter((p) => p.type === "path")
      .map((p) => p.name);

    strictEqual(pathParamNames.includes("provider"), false, "provider should be filtered out");
    strictEqual(
      pathParamNames.includes("singletonName"),
      false,
      "singletonName should be filtered out",
    );
    deepStrictEqual(pathParamNames, ["subscriptionId", "resourceGroupName"]);
  });

  it("calling getHttpOperation twice returns consistent params", async () => {
    const { myOp, program } = await Tester.compile(singletonCode);

    const globalNs = program.getGlobalNamespaceType();
    setRouteOptionsForNamespace(program, globalNs, {
      autoRouteOptions: { routeParamFilter: armStyleRouteParamFilter },
    });

    const [httpOp1] = getHttpOperation(program, myOp);
    const params1 = httpOp1.parameters.parameters
      .filter((p) => p.type === "path")
      .map((p) => p.name);

    const [httpOp2] = getHttpOperation(program, myOp);
    const params2 = httpOp2.parameters.parameters
      .filter((p) => p.type === "path")
      .map((p) => p.name);

    deepStrictEqual(params1, params2, "params should be consistent across calls");
    deepStrictEqual(params1, ["subscriptionId", "resourceGroupName"]);
  });

  it("string literal params are excluded even without routeParamFilter", async () => {
    const { myOp, program } = await Tester.compile(singletonCode);

    const [httpOp] = getHttpOperation(program, myOp);
    const params = httpOp.parameters.parameters
      .filter((p) => p.type === "path")
      .map((p) => p.name);

    strictEqual(params.includes("provider"), false, "string literal provider should be excluded");
    strictEqual(
      params.includes("singletonName"),
      false,
      "string literal singletonName should be excluded",
    );
  });

  it("full ARM lifecycle: validate → lint → emitting all see filtered params", async () => {
    const { myOp, program } = await Tester.compile(singletonCode);

    const globalNs = program.getGlobalNamespaceType();
    setRouteOptionsForNamespace(program, globalNs, {
      autoRouteOptions: { routeParamFilter: armStyleRouteParamFilter },
    });

    // Validating phase: http library's $onValidate calls getAllHttpServices
    program.setCurrentStage("validating");
    const [services] = getAllHttpServices(program);
    const validateParams = services[0].operations[0].parameters.parameters
      .filter((p) => p.type === "path")
      .map((p) => p.name);
    deepStrictEqual(validateParams, ["subscriptionId", "resourceGroupName"]);

    // Linting phase: ARM linter rules call getHttpOperation directly
    program.setCurrentStage("linting");
    const [lintHttpOp] = getHttpOperation(program, myOp);
    const lintParams = lintHttpOp.parameters.parameters
      .filter((p) => p.type === "path")
      .map((p) => p.name);
    deepStrictEqual(lintParams, ["subscriptionId", "resourceGroupName"]);

    // Emitting phase: SDK calls getHttpOperation
    program.setCurrentStage("emitting");
    const [emitHttpOp] = getHttpOperation(program, myOp);
    const emitParams = emitHttpOp.parameters.parameters
      .filter((p) => p.type === "path")
      .map((p) => p.name);
    deepStrictEqual(
      emitParams,
      ["subscriptionId", "resourceGroupName"],
      "emitting phase should see filtered params",
    );
  });
});

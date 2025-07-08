import { ignoreDiagnostics, Model, Namespace } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { getVersioningMutators, VersionedMutators } from "@typespec/versioning";
import { beforeEach, describe, expect, it } from "vitest";
import { getClientOperations, resolveClients } from "../src/client-resolution.js";
import { createTypespecHttpClientTestRunner } from "./test-host.js";

let runner: BasicTestRunner;
describe("Explicit Client Resolution", () => {
  beforeEach(async () => {
    runner = await createTypespecHttpClientTestRunner();
  });

  it("single explicit client", async () => {
    // Description:
    // A spec with exactly one top-level `@service` namespace and explicit @client.
    // Expect: that namespace becomes the sole root client.

    const { DemoService } = (await runner.compile(`
      @test
      @versioned(Versions)
      @service(#{ title: "Widget Service" })
      namespace DemoService;

      enum Versions {
        v1,
        v2,
      }

      model Widget {
        id: string;
        weight: int32;
        color: "red" | "blue";
        @added(Versions.v2) name: string;
      }

      @added(Versions.v2)
      @get
      @route("customGet")
      op customGet(): Widget;
    `)) as { DemoService: Namespace };

    const versions: VersionedMutators = getVersioningMutators(
      runner.program,
      DemoService,
    ) as VersionedMutators;

    expect(versions).toBeDefined();
    expect(versions.kind).toBe("versioned");

    const snapshots = versions.snapshots;
    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].version.name).toBe("v1");
    expect(snapshots[1].version.name).toBe("v2");

    // Resolving clients from snapshot 1 should see the operation added in V2.
    // Explicitly pass the versioning mutator to ensure we resolve the correct version.
    const clients = ignoreDiagnostics(
      resolveClients(runner.program, { mutators: [snapshots[1].mutator] }),
    );
    expect(clients).toHaveLength(1);
    const client = clients[0];
    const operations = getClientOperations(runner.program, client);
    expect(operations[0]).toBeDefined();
    expect(operations[0].name).toBe("customGet");
    const resultType = operations[0].returnType as Model;
    expect(resultType.properties.has("name")).toBeTruthy();

    // Resolving clients from snapshot 0 should not see the operation added in V2.
    const clientsv1 = ignoreDiagnostics(
      resolveClients(runner.program, { mutators: [snapshots[0].mutator] }),
    );
    expect(clientsv1).toHaveLength(1);
    const clientv1 = clientsv1[0];
    const operationsv1 = getClientOperations(runner.program, clientv1);
    expect(operationsv1).toHaveLength(0);
  });
});

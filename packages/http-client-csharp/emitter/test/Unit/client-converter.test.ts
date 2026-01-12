vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("isMultiServiceClient", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should be false for single service client", async () => {
    const program = await typeSpecCompile(
      `
        @route("/test")
        op test(): void;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(client.isMultiServiceClient, false, "Single service client should not be multiservice");
  });

  it("should be true for multiservice client combining multiple services", async () => {
    const program = await typeSpecCompile(
      `
        @service(#{
          title: "Service A",
        })
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
        
        @service(#{
          title: "Service B",
        })
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
    const root = createModel(sdkContext);
    strictEqual(root.name, "Service.MultiService", "Root namespace should be Service.MultiService");

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(client.name, "CombinedClient", "Client should be named CombinedClient");
    strictEqual(client.isMultiServiceClient, true, "Multi-service client should have isMultiServiceClient=true");

    // Verify sub-clients are NOT multiservice clients
    ok(client.children, "Client should have children");
    ok(client.children.length > 0, "Client should have at least one child");
    for (const childClient of client.children) {
      strictEqual(
        childClient.isMultiServiceClient,
        false,
        `Child client '${childClient.name}' should not be a multiservice client`,
      );
    }
  });
});

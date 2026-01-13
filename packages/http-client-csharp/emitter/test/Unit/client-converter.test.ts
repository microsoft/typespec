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

describe("Client Converter", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  describe("Client name suffix", () => {
    it("should append 'Client' suffix to root client without suffix", async () => {
      const program = await typeSpecCompile(
        `
          @service(#{
            title: "Test Service",
          })
          @server("https://{endpoint}/api", "Test endpoint", {
            endpoint: string
          })
          namespace TestService;
          
          op test(): void;
        `,
        runner,
        { IsNamespaceNeeded: false },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const client = root.clients[0];
      ok(client, "Client should exist");
      strictEqual(client.name, "TestServiceClient", "Root client should have 'Client' suffix");
    });

    it("should not duplicate 'Client' suffix if already present", async () => {
      const program = await typeSpecCompile(
        `
          @service(#{
            title: "Test Service",
          })
          @server("https://{endpoint}/api", "Test endpoint", {
            endpoint: string
          })
          namespace TestServiceClient;
          
          op test(): void;
        `,
        runner,
        { IsNamespaceNeeded: false },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const client = root.clients[0];
      ok(client, "Client should exist");
      strictEqual(
        client.name,
        "TestServiceClient",
        "Root client should not have duplicate 'Client' suffix",
      );
    });

    it("should not modify sub-client names", async () => {
      const program = await typeSpecCompile(
        `
          @service(#{
            title: "Test Service",
          })
          @server("https://{endpoint}/api", "Test endpoint", {
            endpoint: string
          })
          namespace TestService {
            interface SubOperations {
              op test(): void;
            }
          }
        `,
        runner,
        { IsNamespaceNeeded: false },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const client = root.clients[0];
      ok(client, "Client should exist");
      strictEqual(client.name, "TestServiceClient", "Root client should have 'Client' suffix");

      ok(client.children, "Client should have children");
      ok(client.children.length > 0, "Client should have at least one child");

      const subClient = client.children[0];
      strictEqual(
        subClient.name,
        "SubOperations",
        "Sub-client should retain original name without 'Client' suffix",
      );
    });

    it("should handle @clientName decorator with lowercase 'client' suffix", async () => {
      const program = await typeSpecCompile(
        `
          @service(#{
            title: "Test Service",
          })
          @server("https://{endpoint}/api", "Test endpoint", {
            endpoint: string
          })
          @clientName("MyServiceclient", "csharp")
          namespace TestService;
          
          op test(): void;
        `,
        runner,
        { IsNamespaceNeeded: false, IsTCGCNeeded: true },
      );
      const context = createEmitterContext(program);
      const sdkContext = await createCSharpSdkContext(context);
      const root = createModel(sdkContext);

      const client = root.clients[0];
      ok(client, "Client should exist");
      strictEqual(
        client.name,
        "MyServiceclient",
        "Root client should preserve @clientName value when it ends with 'client' (case-insensitive)",
      );
    });
  });
});

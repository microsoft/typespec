vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { InputMethodParameter } from "../../src/type/input-type.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("ClientInitialization", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should include parameters in InputClient", async () => {
    const program = await typeSpecCompile(
      `
        @service(#{
          title: "Test Service",
        })
        @server("https://example.com", "Test endpoint")
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
    ok(client.parameters, "Client should have parameters");
    ok(client.parameters.length > 0, "Client should have at least one parameter");
  });

  it("should include initializedBy flag in InputClient", async () => {
    const program = await typeSpecCompile(
      `
        @service(#{
          title: "Test Service",
        })
        @server("https://example.com", "Test endpoint")
        @route("/api")
        namespace MyService {
          op test(): void;
        }
      `,
      runner,
      { IsNamespaceNeeded: false },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    const client = root.clients[0];
    // initializedBy field should exist on the client (may be undefined or have a value)
    ok("initializedBy" in client, "Client should have initializedBy field");
  });

  it("should include endpoint parameter in parameters", async () => {
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
    ok(client.parameters, "Client should have parameters");
    const endpointParam = client.parameters.find((p) => p.kind === "endpoint");
    ok(endpointParam, "Parameters should have endpoint parameter");
    strictEqual(endpointParam.name, "endpoint", "Endpoint parameter should be named 'endpoint'");
  });

  it("should propagate initializedBy to child clients", async () => {
    const program = await typeSpecCompile(
      `
        @service(#{
          title: "Test Service",
        })
        @server("https://example.com", "Test endpoint")
        @route("/api")
        namespace MyService {
          @route("/sub")
          interface SubClient {
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
    ok("initializedBy" in client, "Parent client should have initializedBy field");

    if (client.children && client.children.length > 0) {
      const childClient = client.children[0];
      ok("initializedBy" in childClient, "Child client should have initializedBy field");
    }
  });

  it("should include paramAlias on client parameters when @paramAlias is used", async () => {
    const program = await typeSpecCompile(
      `
        @service(#{
          title: "Test Service",
        })
        @server("https://example.com", "Test endpoint")
        namespace TestService;

        op upload(@path blobName: string): void;

        model TestServiceClientOptions {
          @paramAlias("blobName")
          blob: string;
        }

        @@clientInitialization(TestService, {parameters: TestServiceClientOptions});
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );

    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    ok(client.parameters, "Client should have parameters");

    // Find the method parameter with paramAlias
    const blobParam = client.parameters.find((p) => p.kind === "method" && p.name === "blob") as
      | InputMethodParameter
      | undefined;
    ok(blobParam, "Should have a 'blob' method parameter");
    strictEqual(blobParam.paramAlias, "blobName", "paramAlias should be 'blobName'");
  });

  it("should not include paramAlias when @paramAlias is not used", async () => {
    const program = await typeSpecCompile(
      `
        @service(#{
          title: "Test Service",
        })
        @server("https://example.com", "Test endpoint")
        namespace TestService;

        op upload(@path blobName: string): void;

        model TestServiceClientOptions {
          blobName: string;
        }

        @@clientInitialization(TestService, {parameters: TestServiceClientOptions});
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );

    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    ok(client.parameters, "Client should have parameters");

    const blobParam = client.parameters.find(
      (p) => p.kind === "method" && p.name === "blobName",
    ) as InputMethodParameter | undefined;
    ok(blobParam, "Should have a 'blobName' method parameter");
    strictEqual(
      blobParam.paramAlias,
      undefined,
      "paramAlias should be undefined when @paramAlias is not used",
    );
  });
});

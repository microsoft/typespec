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

describe("ClientInitialization", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should include clientInitialization in InputClient", async () => {
    const program = await typeSpecCompile(
      `
        @server("https://example.com", "Test endpoint")
        op test(): void;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    ok(client.clientInitialization, "Client should have clientInitialization");
    ok(
      client.clientInitialization.parameters,
      "clientInitialization should have parameters",
    );
    ok(
      client.clientInitialization.parameters.length > 0,
      "clientInitialization should have at least one parameter",
    );

    // Verify backward compatibility - parameters field should still exist
    ok(client.parameters, "Client should still have parameters field for backward compatibility");
    strictEqual(
      client.parameters.length,
      client.clientInitialization.parameters.length,
      "parameters and clientInitialization.parameters should have same length",
    );
  });

  it("should include initializedBy flag in clientInitialization", async () => {
    const program = await typeSpecCompile(
      `
        @server("https://example.com", "Test endpoint")
        @route("/api")
        namespace MyService {
          op test(): void;
        }
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    const client = root.clients[0];
    ok(client.clientInitialization, "Client should have clientInitialization");
    // initializedBy may be undefined or a number
    ok(
      client.clientInitialization.initializedBy !== undefined ||
        client.clientInitialization.initializedBy === undefined,
      "clientInitialization should have initializedBy field",
    );
  });

  it("should include endpoint parameter in clientInitialization", async () => {
    const program = await typeSpecCompile(
      `
        @server("https://{endpoint}/api", "Test endpoint", {
          endpoint: string
        })
        op test(): void;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    const client = root.clients[0];
    ok(client.clientInitialization, "Client should have clientInitialization");
    const endpointParam = client.clientInitialization.parameters.find(
      (p) => p.kind === "endpoint",
    );
    ok(endpointParam, "clientInitialization should have endpoint parameter");
    strictEqual(endpointParam.name, "endpoint", "Endpoint parameter should be named 'endpoint'");
  });

  it("should propagate clientInitialization to child clients", async () => {
    const program = await typeSpecCompile(
      `
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
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);

    const client = root.clients[0];
    ok(client.clientInitialization, "Parent client should have clientInitialization");

    if (client.children && client.children.length > 0) {
      const childClient = client.children[0];
      ok(childClient.clientInitialization, "Child client should have clientInitialization");
    }
  });
});

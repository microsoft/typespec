vi.resetModules();

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import { containsMultiServiceClient } from "../../src/lib/utils.js";
import { InputClient } from "../../src/type/input-type.js";
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
    const [root] = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(
      client.isMultiServiceClient,
      false,
      "Single service client should not be multiservice",
    );
  });

  it("should be true for multiservice client combining multiple services using subclients", async () => {
    const program = await typeSpecCompile(
      `
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
          autoMergeService: true,
        })
        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    strictEqual(root.name, "Service.MultiService", "Root namespace should be Service.MultiService");

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(client.name, "CombinedClient", "Client should be named CombinedClient");
    strictEqual(
      client.namespace,
      "Service.MultiService",
      "Client namespace should be Service.MultiService",
    );
    strictEqual(
      client.isMultiServiceClient,
      true,
      "Multi-service client should have isMultiServiceClient=true",
    );

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

  it("should be true for multiservice root client", async () => {
    const program = await typeSpecCompile(
      `
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
          }
          

          @route("/test")
          op testOne(@query("api-version") apiVersion: VersionsA): void;
        }
        
        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
            bv2,
          }
          
          @route("/test")
          op testTwo(@query("api-version") apiVersion: VersionsB): void;
        }
        
        @client({
          name: "CombinedClient",
          service: [ServiceA, ServiceB],
        })

        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    strictEqual(root.name, "Service.MultiService", "Root namespace should be Service.MultiService");

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(client.name, "CombinedClient", "Client should be named CombinedClient");
    strictEqual(
      client.namespace,
      "Service.MultiService",
      "Client namespace should be Service.MultiService",
    );
    strictEqual(
      client.isMultiServiceClient,
      true,
      "Multi-service client should have isMultiServiceClient=true",
    );

    ok(!client.children || client.children.length === 0, "Client should not have any children");
  });

  it("should be true for multiservice mixed clients", async () => {
    const program = await typeSpecCompile(
      `
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
            av2,
          }

          @route("/test")
          op testA(@query("api-version") apiVersion: VersionsA): void;

          @route("foo")
          interface Foo {
            @route("/test")
            testB(@query("api-version") apiVersion: VersionsA): void;
          }
        }

        /**
         * Second service definition in a multi-service package with versioning
         */
        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
            bv2,
          }

          @route("/test")
          op testC(@query("api-version") apiVersion: VersionsB): void;

          @route("bar")
          interface Bar {
            @route("/test")
            testD(@query("api-version") apiVersion: VersionsB): void;
          }
        }
        
        @client({
          name: "CombinedClient",
          service: [ServiceA, ServiceB],
          autoMergeService: true,
        })

        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    strictEqual(root.name, "Service.MultiService", "Root namespace should be Service.MultiService");

    const clients = root.clients;
    strictEqual(clients.length, 1, "There should be one root client");

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(client.name, "CombinedClient", "Client should be named CombinedClient");
    strictEqual(
      client.namespace,
      "Service.MultiService",
      "Client namespace should be Service.MultiService",
    );
    strictEqual(
      client.isMultiServiceClient,
      true,
      "Multi-service client should have isMultiServiceClient=true",
    );

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

describe("multiple services without @client decorator", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("produces a separate root client per service with expected names, namespaces, and sub-clients", async () => {
    const program = await typeSpecCompile(
      `
        namespace Service.MultipleServices;

        @service(#{ title: "Service A" })
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
            av2,
          }

          interface Operations {
            @route("a-test")
            opA(@query("api-version") apiVersion: VersionsA): void;
          }

          namespace SubNamespace {
            @route("a-sub-test")
            op subOpA(@query("api-version") apiVersion: VersionsA): void;
          }
        }

        @service(#{ title: "Service B" })
        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
            bv2,
          }

          interface Operations {
            @route("b-test")
            opB(@query("api-version") apiVersion: VersionsB): void;
          }

          namespace SubNamespace {
            @route("b-sub-test")
            op subOpB(@query("api-version") apiVersion: VersionsB): void;
          }
        }
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: false },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    // The library-level namespace should be the common parent of all services
    strictEqual(
      root.name,
      "Service.MultipleServices",
      "Root namespace should be the common parent namespace of all services",
    );

    // There should be one root client per service
    strictEqual(root.clients.length, 2, "There should be two root clients");

    const serviceAClient = root.clients.find((c) => c.name === "ServiceAClient");
    const serviceBClient = root.clients.find((c) => c.name === "ServiceBClient");
    ok(serviceAClient, "ServiceAClient should exist");
    ok(serviceBClient, "ServiceBClient should exist");

    strictEqual(serviceAClient!.namespace, "Service.MultipleServices.ServiceA");
    strictEqual(serviceBClient!.namespace, "Service.MultipleServices.ServiceB");

    // Each root client represents a single service, so IsMultiServiceClient is false.
    // (The combined multi-service flag only applies to a single root client that
    // aggregates multiple services, e.g. via `@client({ service: [...] })`.)
    strictEqual(
      serviceAClient!.isMultiServiceClient,
      false,
      "Each per-service root client should not itself be a multi-service client",
    );
    strictEqual(serviceBClient!.isMultiServiceClient, false);

    // Roots should have no parent (they are siblings)
    ok(!serviceAClient!.parent, "ServiceAClient should be a root (no parent)");
    ok(!serviceBClient!.parent, "ServiceBClient should be a root (no parent)");

    // Each root client should have its sub-clients: Operations and SubNamespace
    const assertSubClients = (clientName: string, subClients: readonly InputClient[]) => {
      strictEqual(subClients.length, 2, `${clientName} should have 2 sub-clients`);
      ok(
        subClients.some((c) => c.name === "Operations"),
        `${clientName} should contain an Operations sub-client`,
      );
      ok(
        subClients.some((c) => c.name === "SubNamespace"),
        `${clientName} should contain a SubNamespace sub-client`,
      );
    };
    ok(serviceAClient!.children, "ServiceAClient should have children");
    ok(serviceBClient!.children, "ServiceBClient should have children");
    assertSubClients("ServiceAClient", serviceAClient!.children!);
    assertSubClients("ServiceBClient", serviceBClient!.children!);

    ok(
      !containsMultiServiceClient(sdkContext.sdkPackage.clients),
      "No individual root client should be a combined multi-service client",
    );
  });

  it("uses each service's own api version enum on the corresponding root client", async () => {
    const program = await typeSpecCompile(
      `
        namespace Service.MultipleServices;

        @service(#{ title: "Service A" })
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
            av2,
          }

          @route("a-test")
          op opA(@query("api-version") apiVersion: VersionsA): void;
        }

        @service(#{ title: "Service B" })
        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
            bv2,
          }

          @route("b-test")
          op opB(@query("api-version") apiVersion: VersionsB): void;
        }
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: false },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    strictEqual(root.clients.length, 2);

    const serviceAClient = root.clients.find((c) => c.name === "ServiceAClient")!;
    const serviceBClient = root.clients.find((c) => c.name === "ServiceBClient")!;
    ok(serviceAClient, "ServiceAClient should exist");
    ok(serviceBClient, "ServiceBClient should exist");

    // Each root client should only know about its own service's api versions
    strictEqual(serviceAClient.apiVersions.length, 2);
    strictEqual(serviceAClient.apiVersions[0], "av1");
    strictEqual(serviceAClient.apiVersions[1], "av2");

    strictEqual(serviceBClient.apiVersions.length, 2);
    strictEqual(serviceBClient.apiVersions[0], "bv1");
    strictEqual(serviceBClient.apiVersions[1], "bv2");
  });

  it("uses the combined @client namespace when services are merged via @client({ service: [...] })", async () => {
    const program = await typeSpecCompile(
      `
        namespace Service.MultiService;

        @service(#{ title: "Service A" })
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
          }

          @route("a-test")
          op opA(@query("api-version") apiVersion: VersionsA): void;
        }

        @service(#{ title: "Service B" })
        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
          }

          @route("b-test")
          op opB(@query("api-version") apiVersion: VersionsB): void;
        }

        @client({
          service: [ServiceA, ServiceB],
          autoMergeService: true,
        })
        namespace Combined {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    // The root namespace should be the combined @client namespace, not the
    // shared parent of the @service-decorated namespaces.
    strictEqual(
      root.name,
      "Service.MultiService.Combined",
      "Root namespace should match the combined @client namespace",
    );

    strictEqual(root.clients.length, 1, "There should be a single combined root client");
    const client = root.clients[0];
    strictEqual(client.namespace, "Service.MultiService.Combined");
    strictEqual(
      client.isMultiServiceClient,
      true,
      "Combined client should be a multi-service client",
    );
    ok(
      containsMultiServiceClient(sdkContext.sdkPackage.clients),
      "Library should contain a multi-service client",
    );
  });
});

describe("client name suffix", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("should append Client suffix to multi-service root client without suffix", async () => {
    const program = await typeSpecCompile(
      `
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
          }

          @route("/test")
          op testOne(@query("api-version") apiVersion: VersionsA): void;
        }

        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
          }

          @route("/test")
          op testTwo(@query("api-version") apiVersion: VersionsB): void;
        }

        @client({
          name: "Combined",
          service: [ServiceA, ServiceB],
        })
        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(
      client.name,
      "CombinedClient",
      "Multi-service root client should have Client suffix appended",
    );
  });

  it("should not duplicate Client suffix for multi-service root client already ending with Client", async () => {
    const program = await typeSpecCompile(
      `
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
          }

          @route("/test")
          op testOne(@query("api-version") apiVersion: VersionsA): void;
        }

        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
          }

          @route("/test")
          op testTwo(@query("api-version") apiVersion: VersionsB): void;
        }

        @client({
          name: "CombinedClient",
          service: [ServiceA, ServiceB],
        })
        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(
      client.name,
      "CombinedClient",
      "Multi-service root client already ending with Client should not have suffix duplicated",
    );
  });

  it("should not duplicate Client suffix with different casing", async () => {
    const program = await typeSpecCompile(
      `
        @versioned(VersionsA)
        namespace ServiceA {
          enum VersionsA {
            av1,
          }

          @route("/test")
          op testOne(@query("api-version") apiVersion: VersionsA): void;
        }

        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
          }

          @route("/test")
          op testTwo(@query("api-version") apiVersion: VersionsB): void;
        }

        @client({
          name: "CombinedCLIENT",
          service: [ServiceA, ServiceB],
        })
        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(
      client.name,
      "CombinedCLIENT",
      "Multi-service root client ending with CLIENT (uppercase) should not have suffix duplicated",
    );
  });

  it("should not append Client suffix to sub-clients of multi-service client", async () => {
    const program = await typeSpecCompile(
      `
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

        @versioned(VersionsB)
        namespace ServiceB {
          enum VersionsB {
            bv1,
          }

          @route("/b")
          interface BI {
            @route("test")
            op bTest(): void;
          }
        }

        @client({
          name: "Combined",
          service: [ServiceA, ServiceB],
          autoMergeService: true,
        })
        namespace Service.MultiService {}
      `,
      runner,
      { IsNamespaceNeeded: false, IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);

    const client = root.clients[0];
    ok(client, "Client should exist");
    strictEqual(
      client.name,
      "CombinedClient",
      "Multi-service root client should have Client suffix appended",
    );

    // Verify sub-clients do NOT have Client suffix appended
    ok(client.children, "Client should have children");
    ok(client.children.length > 0, "Client should have at least one child");
    for (const childClient of client.children) {
      strictEqual(
        childClient.name.endsWith("Client"),
        false,
        `Child client '${childClient.name}' should not have Client suffix`,
      );
    }
  });
});

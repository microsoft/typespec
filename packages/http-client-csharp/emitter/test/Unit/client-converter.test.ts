vi.resetModules();

import type { TestHost } from "@typespec/compiler/testing";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it, vi } from "vitest";
import { serializeCodeModel } from "../../src/code-model-writer.js";
import { createModel } from "../../src/lib/client-model-builder.js";
import { containsMultiServiceClient } from "../../src/lib/utils.js";
import type { InputClient } from "../../src/type/input-type.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("API-version override metadata", () => {
  const overrideDecorator = "Azure.Core.Legacy.@overrideApiVersion";
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  async function createOverrideModel(code: string, additionalDecorators: string[] = []) {
    const program = await typeSpecCompile(code, runner, {
      IsNamespaceNeeded: false,
      IsAzureCoreNeeded: true,
      IsTCGCNeeded: true,
    });
    expectDiagnosticEmpty(program.diagnostics);
    const context = await createCSharpSdkContext(createEmitterContext(program), {
      additionalDecorators,
    });
    expectDiagnosticEmpty(context.diagnostics);
    const [model, diagnostics] = createModel(context);
    expectDiagnosticEmpty(diagnostics);
    return { model, context };
  }

  function overrideValue(target: Pick<InputClient, "decorators">) {
    const markers = target.decorators?.filter((d) => d.name === overrideDecorator) ?? [];
    ok(markers.length <= 1, "There must be at most one effective override marker");
    return markers[0]?.arguments.version;
  }

  it.each(["namespace", "interface"])(
    "preserves %s overrides independently of supported versions and defaults",
    async (target) => {
      const versions = ["v1", "v2"];
      const { model, context } = await createOverrideModel(`
        @service
        @versioned(Versions)
        namespace Test {
          enum Versions { v1, v2 }
          @Azure.Core.Legacy.overrideApiVersion("v1")
          ${target} Supported {
            @route("/supported") @get
            op read(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
          @Azure.Core.Legacy.overrideApiVersion("v2")
          ${target} Default {
            @route("/default") @get
            op read(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
          @Azure.Core.Legacy.overrideApiVersion("opaque legacy wire value")
          ${target} Legacy {
            @route("/legacy") @get
            op read(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
          ${target} Regular {
            @route("/regular") @get
            op read(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
        }
      `);
      const root = model.clients[0];
      strictEqual(overrideValue(root), undefined);
      deepStrictEqual(root.apiVersions, versions);
      for (const [name, version] of [
        ["Supported", "v1"],
        ["Default", "v2"],
        ["Legacy", "opaque legacy wire value"],
        ["Regular", undefined],
      ]) {
        const client: InputClient | undefined = root.children?.find((c) => c.name === name);
        ok(client);
        strictEqual(overrideValue(client), version);
        strictEqual(overrideValue(client.methods[0].operation), version);
        deepStrictEqual(client.apiVersions, versions);
        const serializedClient = JSON.parse(
          serializeCodeModel(context, model),
        ).clients[0].children.find((c: InputClient) => c.name === name);
        strictEqual(overrideValue(serializedClient), version);
        strictEqual(overrideValue(serializedClient.methods[0].operation), version);
        if (name === "Default" || name === "Regular") {
          strictEqual(client.parameters?.find((p) => p.isApiVersion)?.defaultValue?.value, "v2");
        }
      }
    },
  );

  it("preserves unrelated decorators without duplicating or mutating existing overrides", async () => {
    const { model, context } = await createOverrideModel(
      `
        @service @versioned(Versions)
        namespace Test {
          enum Versions { v1, v2 }
          @clientName("Legacy") @Azure.Core.Legacy.overrideApiVersion("v2")
          interface Original {
            @clientName("Fetch") @route("/read") @get
            op read(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
        }
      `,
      [
        "Azure\\.Core\\.Legacy\\.@overrideApiVersion",
        "Azure\\.ClientGenerator\\.Core\\.@clientName",
      ],
    );
    const client = model.clients[0].children?.find((c) => c.name === "Legacy");
    ok(client);
    strictEqual(overrideValue(client), "v2");
    deepStrictEqual(
      client.decorators?.find((d) => d.name === "Azure.ClientGenerator.Core.@clientName")
        ?.arguments,
      { rename: "Legacy" },
    );
    const operation = client.methods[0].operation;
    strictEqual(overrideValue(operation), "v2");
    deepStrictEqual(
      operation.decorators?.find((d) => d.name === "Azure.ClientGenerator.Core.@clientName")
        ?.arguments,
      { rename: "Fetch" },
    );
    const sdkClient = context.sdkPackage.clients[0].children?.find((c) => c.name === "Legacy");
    ok(sdkClient);
    strictEqual(overrideValue(sdkClient), "v2");
    ok(client.decorators !== sdkClient.decorators);
    strictEqual(overrideValue(sdkClient.methods[0]), undefined);
  });

  it("resolves inherited overrides through namespaces omitted from the client hierarchy", async () => {
    const { model } = await createOverrideModel(`
      @service @versioned(Versions) @client
      namespace Test {
        enum Versions { v1, v2 }
        @Azure.Core.Legacy.overrideApiVersion("outer")
        namespace Hidden {
          @client
          interface Inherited {
            @route("/inherited") @get
            op read(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
          @Azure.Core.Legacy.overrideApiVersion("inner")
          namespace Nested {
            @client
            interface NearestNamespace {
              @route("/namespace") @get
              op read(...Azure.Core.Foundations.ApiVersionParameter): void;
            }
            @client @Azure.Core.Legacy.overrideApiVersion("interface")
            interface NearestInterface {
              @route("/interface") @get
              op read(...Azure.Core.Foundations.ApiVersionParameter): void;
            }
          }
        }
      }
    `);
    const root = model.clients[0];
    strictEqual(overrideValue(root), undefined);
    deepStrictEqual(root.children?.map((c) => c.name).sort(), [
      "Inherited",
      "NearestInterface",
      "NearestNamespace",
    ]);
    for (const [name, version] of [
      ["Inherited", "outer"],
      ["NearestNamespace", "inner"],
      ["NearestInterface", "interface"],
    ]) {
      const client: InputClient | undefined = root.children?.find((c) => c.name === name);
      ok(client);
      strictEqual(client.parent, root);
      strictEqual(overrideValue(client), version);
    }
  });

  it("inherits service overrides and prefers nearer namespace and interface overrides", async () => {
    const { model } = await createOverrideModel(`
      @service @versioned(Versions) @Azure.Core.Legacy.overrideApiVersion("service")
      namespace Test {
        enum Versions { v1, v2 }
        @route("/root") @get
        op read(...Azure.Core.Foundations.ApiVersionParameter): void;
        namespace Child {
          interface Inherited {
            @route("/inherited") @get
            op read(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
          @Azure.Core.Legacy.overrideApiVersion("namespace")
          namespace Nested {
            interface Inherited {
              @route("/namespace") @get
              op read(...Azure.Core.Foundations.ApiVersionParameter): void;
            }
            @Azure.Core.Legacy.overrideApiVersion("interface")
            interface Nearest {
              @route("/interface") @get
              op read(...Azure.Core.Foundations.ApiVersionParameter): void;
            }
          }
        }
      }
    `);
    const root = model.clients[0];
    strictEqual(overrideValue(root), "service");
    strictEqual(overrideValue(root.methods[0].operation), "service");
    const child = root.children?.find((c) => c.name === "Child");
    ok(child);
    strictEqual(overrideValue(child), "service");
    const inherited = child.children?.find((c) => c.name === "Inherited");
    ok(inherited);
    strictEqual(overrideValue(inherited), "service");
    strictEqual(overrideValue(inherited.methods[0].operation), "service");
    const nested = child.children?.find((c) => c.name === "Nested");
    ok(nested);
    strictEqual(overrideValue(nested), "namespace");
    for (const [name, version] of [
      ["Inherited", "namespace"],
      ["Nearest", "interface"],
    ]) {
      const client: InputClient | undefined = nested.children?.find((c) => c.name === name);
      ok(client);
      strictEqual(overrideValue(client), version);
      strictEqual(overrideValue(client.methods[0].operation), version);
    }
  });

  it.each([false, true])(
    "preserves source overrides on relocated operations (alias: %s)",
    async (alias) => {
      const { model } = await createOverrideModel(`
        @service @versioned(Versions)
        namespace Test {
          enum Versions { v1, v2 }
          @route("/regular") @get
          op regular(...Azure.Core.Foundations.ApiVersionParameter): void;
          @Azure.Core.Legacy.overrideApiVersion("source")
          interface Original {
            ${alias ? "" : '@clientLocation("Relocated")'}
            @route("/original") @get
            op read(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
          ${
            alias
              ? `
                @route("/intermediate")
                op intermediate is Original.read;
                @clientLocation("Relocated") @route("/relocated")
                op relocated is intermediate;
              `
              : ""
          }
        }
      `);
      const root = model.clients[0];
      const relocated = root.children?.find((c) => c.name === "Relocated");
      ok(relocated);
      strictEqual(overrideValue(root), undefined);
      strictEqual(overrideValue(relocated), "source");
      strictEqual(overrideValue(relocated.methods[0].operation), "source");
    },
  );

  it("prefers an alias's declaring override over its source override", async () => {
    const { model } = await createOverrideModel(`
      @service @versioned(Versions)
      namespace Test {
        enum Versions { v1, v2 }
        @Azure.Core.Legacy.overrideApiVersion("source")
        interface Original {
          @route("/original") @get
          op read(...Azure.Core.Foundations.ApiVersionParameter): void;
        }
        @Azure.Core.Legacy.overrideApiVersion("destination")
        interface Destination {
          @route("/destination")
          op relocated is Original.read;
        }
      }
    `);
    const destination = model.clients[0].children?.find((c) => c.name === "Destination");
    ok(destination);
    strictEqual(overrideValue(destination), "destination");
    strictEqual(overrideValue(destination.methods[0].operation), "destination");
  });

  it.each([false, true])(
    "does not infer a client-wide override from mixed relocated operations (regular: %s)",
    async (includeRegular) => {
      const { model, context } = await createOverrideModel(`
      @service @versioned(Versions)
      namespace Test {
        enum Versions { v1, v2 }
        @Azure.Core.Legacy.overrideApiVersion("first")
        interface First {
          @clientLocation("Mixed") @route("/first") @get
          op first(...Azure.Core.Foundations.ApiVersionParameter): void;
        }
        @Azure.Core.Legacy.overrideApiVersion("second")
        interface Second {
          @clientLocation("Mixed") @route("/second") @get
          op second(...Azure.Core.Foundations.ApiVersionParameter): void;
        }
        ${
          includeRegular
            ? `@clientLocation("Mixed") @route("/regular") @get
               op regular(...Azure.Core.Foundations.ApiVersionParameter): void;`
            : ""
        }
      }
    `);
      const mixed = model.clients[0].children?.find((c) => c.name === "Mixed");
      ok(mixed);
      strictEqual(overrideValue(mixed), undefined);
      for (const [name, version] of [
        ["first", "first"],
        ["second", "second"],
        ...(includeRegular ? [["regular", undefined]] : []),
      ]) {
        const method: InputClient["methods"][number] | undefined = mixed.methods.find(
          (m) => m.name === name,
        );
        ok(method);
        strictEqual(overrideValue(method.operation), version);
      }
      const serialized = JSON.parse(serializeCodeModel(context, model)).clients[0].children.find(
        (c: InputClient) => c.name === "Mixed",
      );
      strictEqual(overrideValue(serialized), undefined);
      deepStrictEqual(
        serialized.methods.map((m: InputClient["methods"][number]) => overrideValue(m.operation)),
        mixed.methods.map((m) => overrideValue(m.operation)),
      );
    },
  );

  it.each(["shared", "different", undefined])(
    "preserves per-operation overrides on merged clients (second override: %s)",
    async (secondOverride) => {
      const { model, context } = await createOverrideModel(`
        @service @versioned(VersionsA) @Azure.Core.Legacy.overrideApiVersion("shared")
        namespace ServiceA {
          enum VersionsA { av1, av2 }
          interface Legacy {
            @route("/a") @get
            op readA(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
        }
        @service @versioned(VersionsB)
        ${
          secondOverride === undefined
            ? ""
            : `@Azure.Core.Legacy.overrideApiVersion("${secondOverride}")`
        }
        namespace ServiceB {
          enum VersionsB { bv1, bv2 }
          interface Legacy {
            @route("/b") @get
            op readB(...Azure.Core.Foundations.ApiVersionParameter): void;
          }
        }
        @client({ service: [ServiceA, ServiceB], autoMergeService: true })
        namespace Combined {}
      `);
      const root = model.clients[0];
      const client = root.children?.find((c) => c.name === "Legacy");
      ok(client);
      const sdkClient = context.sdkPackage.clients[0].children?.find((c) => c.name === "Legacy");
      ok(sdkClient);
      strictEqual(sdkClient.__raw.type, undefined);
      strictEqual(sdkClient.__raw.services.length, 2);
      strictEqual(overrideValue(root), undefined);
      strictEqual(overrideValue(client), secondOverride === "shared" ? "shared" : undefined);
      deepStrictEqual(client.apiVersions, sdkClient.apiVersions);
      strictEqual(client.methods.length, 2);
      for (const [name, version] of [
        ["readA", "shared"],
        ["readB", secondOverride],
      ]) {
        const method: InputClient["methods"][number] | undefined = client.methods.find(
          (m) => m.name === name,
        );
        ok(method);
        strictEqual(overrideValue(method.operation), version);
      }
    },
  );
});

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

describe("Test isExactName propagation on clients", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("propagates isExactName from @clientName decorator with exact() on a client", async () => {
    const program = await typeSpecCompile(
      `
        @@clientName(Azure.Csharp.Testing, Azure.ClientGenerator.Core.exact("snake_case_client"), "csharp");
        op test(): void;
      `,
      runner,
      { IsTCGCNeeded: true },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [root] = createModel(sdkContext);
    const client = root.clients.find((c) => c.name === "snake_case_client");
    ok(client);
    strictEqual(client.isExactName, true);
  });
});

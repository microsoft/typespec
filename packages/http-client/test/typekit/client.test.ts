import { Interface, Namespace } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { ok } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { createTypespecHttpClientLibraryTestRunner } from "../test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTypespecHttpClientLibraryTestRunner();
});

describe("isSameConstructor", () => {
  it("should return true for the same client", async () => {
    const { DemoService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService;
      `)) as { DemoService: Namespace };

    const client = $.client.getClient(DemoService);

    expect($.client.haveSameConstructor(client, client)).toBeTruthy();
  });

  it("should return false for the clients with different constructors", async () => {
    const { DemoService, SubClient } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService {
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
        @test namespace SubClient {
        }
      }
      `)) as { DemoService: Namespace; SubClient: Namespace };

    const client = $.client.getClient(DemoService);
    const subClient = $.client.getClient(SubClient);

    expect($.client.haveSameConstructor(client, subClient)).toBeFalsy();
  });

  it.skip("should return true when subclient doesn't override the client params", async () => {
    const { DemoService, SubClient } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
      @test namespace DemoService {
        @test namespace SubClient {
        }
      }
      `)) as { DemoService: Namespace; SubClient: Namespace };

    const demoClient = $.client.getClient(DemoService);
    const subClient = $.client.getClient(SubClient);

    expect($.client.haveSameConstructor(demoClient, subClient)).toBeTruthy();
  });

  it("should return false for the clients with different constructor", async () => {
    const { DemoService, SubClient } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService {
        @test namespace SubClient {
        }
      }
      `)) as { DemoService: Namespace; SubClient: Namespace };

    const client = $.client.getClient(DemoService);
    const subClient = $.client.getClient(SubClient);

    expect($.client.haveSameConstructor(client, subClient)).toBeTruthy();
  });
});

describe("getClient", () => {
  it("should get a client from the globalNamespace", async () => {
    (await runner.compile(`
       op foo(): void;
      `)) as { DemoService: Namespace };

    const namespace = $.program.getGlobalNamespaceType();
    const client = $.client.getClient(namespace);

    expect(client.name).toEqual("Client");
  });

  it("should get the client", async () => {
    const { DemoService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService;
      `)) as { DemoService: Namespace };

    const client = $.client.getClient(DemoService);

    expect(client.name).toEqual("DemoServiceClient");
    expect(client.service).toEqual(DemoService);
    expect(client.type).toEqual(DemoService);
  });

  it("should preserve client object identity", async () => {
    const { DemoService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService;
      `)) as { DemoService: Namespace };

    const client1 = $.client.getClient(DemoService);
    const client2 = $.client.getClient(DemoService);
    expect(client1).toBe(client2);
  });

  it("should get a flattened list of clients", async () => {
    const { DemoService, BarBaz } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService {
        @test namespace Foo {
           @test namespace FooBaz {}
        }

        @test namespace Bar {
           @test interface BarBaz {}
        }
      }
      `)) as { DemoService: Namespace; BarBaz: Interface };

    const client = $.client.getClient(DemoService);
    const flatClients = $.client.flat(client);
    const barBaz = $.client.getClient(BarBaz);
    expect(flatClients).toHaveLength(5);
    const barBazClient = flatClients.find((c) => c.type === barBaz.type);
    expect(barBazClient).toBeDefined();
  });
});

describe("getConstructor", () => {
  describe("credential parameter", () => {
    it("none", async () => {
      const { DemoService } = (await runner.compile(`
        @service({
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);
      // no overloads, should just be one
      expect($.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      expect($.scalar.isString(params[0].type)).toBeTruthy();
    });
    it("apikey", async () => {
      const { DemoService } = (await runner.compile(`
        @service({
          title: "Widget Service",
        })
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);
      // no constructor overloads, should just be one
      expect($.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(2);
      expect(params[0].name).toEqual("endpoint");
      expect($.scalar.isString(params[0].type)).toBeTruthy();
      const credParam = params[1];
      expect(credParam.name).toEqual("credential");
      ok($.literal.isString(credParam.type));
      expect(credParam.type.value).toEqual("apiKey");
    });

    it("bearer", async () => {
      const { DemoService } = (await runner.compile(`
        @service({
          title: "Widget Service",
        })
        @useAuth(OAuth2Auth<[{
          type: OAuth2FlowType.implicit;
          authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize";
          scopes: ["https://security.microsoft.com/.default"];
        }]>)
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);
      // no constructor overloads, should just be one
      expect($.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(2);
      expect(params[0].name).toEqual("endpoint");
      expect($.scalar.isString(params[0].type)).toBeTruthy();
      const credParam = params[1];
      expect(credParam.name).toEqual("credential");
      ok($.literal.isString(credParam.type));
      expect(credParam.type.value).toEqual("oauth2");
    });
  });
  describe("endpoint", () => {
    it("no servers", async () => {
      const { DemoService } = (await runner.compile(`
        @service({
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);
      // no overloads, should just be one
      expect($.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      expect($.scalar.isString(params[0].type)).toBeTruthy();
    });
    it("one server, no params", async () => {
      const { DemoService } = (await runner.compile(`
        @server("https://example.com", "The service endpoint")
        @service({
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);
      expect($.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      const clientDefaultValue = $.modelProperty.getClientDefaultValue(client, params[0]);
      ok(clientDefaultValue?.valueKind === "StringValue");
      expect(clientDefaultValue.value).toEqual("https://example.com");
    });
    it("one server with parameter", async () => {
      const { DemoService } = (await runner.compile(`
        @server("https://example.com/{name}/foo", "My service url", { name: string })
        @service({
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);

      // base operation
      expect(constructor.returnType).toEqual($.program.checker.voidType);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(2);
      const endpointParam = params.find((p) => p.name === "endpoint");
      ok(endpointParam);
      expect(endpointParam.optional).toBeTruthy();

      const nameParam = params.find((p) => p.name === "name");
      ok(nameParam);
      expect(nameParam.optional).toBeTruthy();

      // should have two overloads, one for completely overriding endpoint, one for just the parameter name
      expect($.operation.getOverloads(client, constructor)).toHaveLength(2);

      // parameter name overload
      const paramNameOverload = $.operation
        .getOverloads(client, constructor)
        .find((o) => $.operation.getClientSignature(client, o).find((p) => p.name === "name"));
      ok(paramNameOverload);

      const paramNameOverloadParams = $.operation.getClientSignature(client, paramNameOverload);
      expect(paramNameOverloadParams).toHaveLength(1);
      expect(paramNameOverloadParams[0].name).toEqual("name");
      expect(paramNameOverloadParams[0].optional).toBeFalsy();

      expect(paramNameOverload.returnType).toEqual($.program.checker.voidType);

      // endpoint overload
      const endpointOverload = $.operation
        .getOverloads(client, constructor)
        .find((o) => $.operation.getClientSignature(client, o).find((p) => p.name === "endpoint"));
      ok(endpointOverload);

      const endpointOverloadParams = $.operation.getClientSignature(client, endpointOverload);
      expect(endpointOverloadParams).toHaveLength(1);
      expect(endpointOverloadParams[0].name).toEqual("endpoint");
      expect(endpointOverloadParams[0].optional).toBeFalsy();

      expect(endpointOverload.returnType).toEqual($.program.checker.voidType);
    });
    it("multiple servers", async () => {
      const { DemoService } = (await runner.compile(`
        @server("https://example.com", "The service endpoint")
        @server("https://example.org", "The service endpoint")
        @service({
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };
      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);

      // base operation
      expect(constructor.returnType).toEqual($.program.checker.voidType);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      const endpointParam = params.find((p) => p.name === "endpoint");
      ok(endpointParam);
      expect(endpointParam.optional).toBeFalsy();
      // TODO: i'm getting a ProxyRef to a String type instead of an actual string type, so $.isString is failing
      ok(endpointParam.type.kind === "Scalar" && endpointParam.type.name === "string");

      // should have two overloads, one for each server
      const overloads = $.operation.getOverloads(client, constructor);
      expect(overloads).toHaveLength(2);

      // .com overload
      const comOverload = overloads[0];
      const comOverloadParams = $.operation.getClientSignature(client, comOverload);
      expect(comOverloadParams).toHaveLength(1);
    });
  });
});

describe("isPubliclyInitializable", () => {
  it("namespace", async () => {
    const { DemoService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService;
      `)) as { DemoService: Namespace };

    const responses = $.clientLibrary.listClients(DemoService);
    expect(responses).toHaveLength(1);
    expect(responses[0].name).toEqual("DemoServiceClient");
    expect($.client.isPubliclyInitializable(responses[0])).toBeTruthy();
  });
  it("nested namespace", async () => {
    const { DemoService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService {
        namespace NestedService {};
      }
      `)) as { DemoService: Namespace };

    const responses = $.clientLibrary.listClients(DemoService);
    expect(responses).toHaveLength(1);
    expect(responses[0].name).toEqual("DemoServiceClient");
    expect($.client.isPubliclyInitializable(responses[0])).toBeTruthy();

    const subclients = $.clientLibrary.listClients(responses[0]);
    expect(subclients).toHaveLength(1);
    expect(subclients[0].name).toEqual("NestedServiceClient");
    expect($.client.isPubliclyInitializable(subclients[0])).toBeTruthy();
  });
  it("nested interface", async () => {
    const { DemoService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService {
        interface NestedInterface {};
      }
      `)) as { DemoService: Namespace };

    const responses = $.clientLibrary.listClients(DemoService);
    expect(responses).toHaveLength(1);
    expect(responses[0].name).toEqual("DemoServiceClient");
    expect($.client.isPubliclyInitializable(responses[0])).toBeTruthy();

    const subclients = $.clientLibrary.listClients(responses[0]);
    expect(subclients).toHaveLength(1);
    expect(subclients[0].name).toEqual("NestedInterfaceClient");
    expect($.client.isPubliclyInitializable(subclients[0])).toBeFalsy();
  });
});

describe("listServiceOperations", () => {
  it("should list only operations defined in the spec", async () => {
    await runner.compile(`
      op foo(): void;
     `);

    const namespace = $.program.getGlobalNamespaceType();
    const client = $.client.getClient(namespace);

    const operations = $.client.listHttpOperations(client);

    expect(operations).toHaveLength(1);
    expect(operations[0].operation.name).toEqual("foo");
  });

  it("no operations", async () => {
    const { DemoService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService;
      `)) as { DemoService: Namespace };
    const client = $.clientLibrary.listClients(DemoService)[0];
    const operations = $.client.listHttpOperations(client);
    expect(operations).toHaveLength(0);
  });
  it("nested namespace", async () => {
    const { DemoService, NestedService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService {
        @route("demo")
        op demoServiceOp(): void;
        @test namespace NestedService {
          @route("nested")
          op nestedServiceOp(): void;
        };
      }
      `)) as { DemoService: Namespace; NestedService: Namespace };

    const demoServiceClient = $.clientLibrary.listClients(DemoService)[0];
    expect($.client.listHttpOperations(demoServiceClient)).toHaveLength(1);
    expect($.client.listHttpOperations(demoServiceClient)[0].operation.name).toEqual(
      "demoServiceOp",
    );

    const nestedServiceClient = $.clientLibrary.listClients(NestedService)[0];
    expect($.client.listHttpOperations(nestedServiceClient)).toHaveLength(1);
    expect($.client.listHttpOperations(nestedServiceClient)[0].operation.name).toEqual(
      "nestedServiceOp",
    );
  });
});

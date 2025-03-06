import { Interface, Namespace, StringLiteral, StringValue, Union } from "@typespec/compiler";
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
      @service(#{
        title: "Widget Service",
      })
      @test namespace DemoService;
      `)) as { DemoService: Namespace };

    const client = $.client.getClient(DemoService);

    expect($.client.haveSameConstructor(client, client)).toBeTruthy();
  });

  it("should return false for the clients with different constructors", async () => {
    const { DemoService, SubClient } = (await runner.compile(`
      @service(#{
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
      @service(#{
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
      @service(#{
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
      @service(#{
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
      @service(#{
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
      @service(#{
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
        @service(#{
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
        @service(#{
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
      /**
       * This test validates that:
       * - There are no overloads
       * - A single constructor with an endpoint parameter that is required
       * - A single constructor with a credential parameter that is required.
       */
      const { DemoService } = (await runner.compile(`
        @service(#{
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
        @service(#{
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
        @service(#{
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
      /**
       * This test validates that:
       *  - There are no overloads
       *  - A single constructor with an endpoint parameter that is required but has a default value
       *  - The endpoint default value is the url template https://example.com/{name}/foo
       *  - There is a required name parameter of type string
       */
      const { DemoService } = (await runner.compile(`
        @server("https://example.com/{name}/foo", "My service url", { name: string })
        @service(#{
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);

      // base operation.
      // The base operation needs to satisfy all overloads, so it should have the most parameters
      // In this test, the base operation should have the endpoint and name parameters both optional
      // in the base constructor.
      expect(constructor.returnType).toEqual($.program.checker.voidType);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(2);
      // Endpoint is required with a default value
      const endpointParam = params.find((p) => p.name === "endpoint");
      ok(endpointParam);
      expect(endpointParam.optional).toBeFalsy();
      const defaultEndpointValue = endpointParam.defaultValue as StringValue;
      expect(defaultEndpointValue.value).toEqual("https://example.com/{name}/foo");

      // Name parameter is required
      const nameParam = params.find((p) => p.name === "name");
      ok(nameParam);
      expect(nameParam.optional).toBeFalsy();
      // Name parameter has no default value
      expect(nameParam.defaultValue).toBeUndefined();

      // Should have no overloads
      expect($.operation.getOverloads(client, constructor)).toHaveLength(0);
    });
    it("one server with parameter named endpoint", async () => {
      /**
       * This test validates that:
       *  - There are no overloads
       *  - A constructor parameter named endpoint which maps to the template variable that is required but has a default value
       *  - A constructor parameter named _endpoint (due to collission) which has a default value which is the url template https://{endpoint}/foo
       */
      const { DemoService } = (await runner.compile(`
        @server("https://{endpoint}/foo", "My service url", { endpoint: string })
        @service(#{
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);

      expect(constructor.returnType).toEqual($.program.checker.voidType);
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(2);
      // Endpoint is required with a default value
      const endpointParam = params.find((p) => p.name === "endpoint");
      ok(endpointParam);
      expect(endpointParam.optional).toBeFalsy();
      expect(endpointParam.defaultValue).toBeUndefined();

      // Name parameter is required
      const internalEndpointParam = params.find((p) => p.name === "_endpoint");
      ok(internalEndpointParam);
      expect(internalEndpointParam.optional).toBeFalsy();
      // Name parameter has no default value
      expect(internalEndpointParam.defaultValue).toBeDefined();
      const internalEndpointDefaultValue = internalEndpointParam.defaultValue as StringValue;
      expect(internalEndpointDefaultValue.value).toEqual("https://{endpoint}/foo");

      // Should have no overloads
      expect($.operation.getOverloads(client, constructor)).toHaveLength(0);
    });
    it("multiple servers", async () => {
      /**
       * This test validates that:
       *  - There are no overloads
       *  - The base constructor has a single endpoint parameter that is required
       *  - The endpoint parameter has a type of union including the 2 clientDefaultValues plus string.
       */

      const { DemoService } = (await runner.compile(`
        @server("https://example.com", "The service endpoint")
        @server("https://example.org", "The service endpoint")
        @service(#{
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };
      const client = $.clientLibrary.listClients(DemoService)[0];

      // There is a single constructor so no overloads.
      const overloads = $.operation.getOverloads(client, $.client.getConstructor(client));
      expect(overloads).toHaveLength(0);

      // The base constructor should have a single endpoint parameter that is required
      const baseConstructor = $.client.getConstructor(client);
      const baseParams = $.operation.getClientSignature(client, baseConstructor);
      expect(baseParams).toHaveLength(1);
      const endpointParam = baseParams.find((p) => p.name === "endpoint");
      expect(endpointParam?.optional).toBeFalsy();

      // The endpoint parameter should have a type of union including the 2 default client parameters
      // plus string.
      expect(endpointParam?.type.kind).toEqual("Union");
      const typeVariants = (endpointParam?.type as Union).variants;
      expect(typeVariants.size).toBe(3);
      const values = Array.from(typeVariants.values());
      expect((values[0].type as StringLiteral).value).toEqual("https://example.org");
      expect((values[1].type as StringLiteral).value).toEqual("https://example.com");
      expect(values[2].type).toEqual($.builtin.string);
    });
  });
});

describe("isPubliclyInitializable", () => {
  it("namespace", async () => {
    const { DemoService } = (await runner.compile(`
      @service(#{
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
      @service(#{
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
      @service(#{
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
      @service(#{
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
      @service(#{
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

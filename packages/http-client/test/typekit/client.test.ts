import { StringLiteral, StringValue, Union } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { ok } from "assert";
import { describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { Tester } from "../test-host.js";

describe("isSameConstructor", () => {
  it("should return true for the same client", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")};
      `);
    const tk = $(program);

    const client = tk.client.getClient(DemoService);

    expect(tk.client.haveSameConstructor(client, client)).toBeTruthy();
  });

  it("should return false for the clients with different constructors", async () => {
    const { DemoService, SubClient, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")} {
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
        namespace ${t.namespace("SubClient")} {
        }
      }
      `);
    const tk = $(program);

    const client = tk.client.getClient(DemoService);
    const subClient = tk.client.getClient(SubClient);

    expect(tk.client.haveSameConstructor(client, subClient)).toBeFalsy();
  });

  it.skip("should return true when subclient doesn't override the client params", async () => {
    const { DemoService, SubClient, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
      namespace ${t.namespace("DemoService")} {
        namespace ${t.namespace("SubClient")} {
        }
      }
      `);
    const tk = $(program);

    const demoClient = tk.client.getClient(DemoService);
    const subClient = tk.client.getClient(SubClient);

    expect(tk.client.haveSameConstructor(demoClient, subClient)).toBeTruthy();
  });

  it("should return false for the clients with different constructor", async () => {
    const { DemoService, SubClient, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")} {
        @test namespace ${t.namespace("SubClient")} {
        }
      }
      `);
    const tk = $(program);

    const client = tk.client.getClient(DemoService);
    const subClient = tk.client.getClient(SubClient);

    expect(tk.client.haveSameConstructor(client, subClient)).toBeTruthy();
  });
});

describe("getClient", () => {
  it("should get a client from the globalNamespace", async () => {
    const { program } = await Tester.compile(t.code`
       op foo(): void;
      `);
    const tk = $(program);

    const namespace = tk.program.getGlobalNamespaceType();
    const client = tk.client.getClient(namespace);

    expect(client.name).toEqual("Client");
  });

  it("should get the client", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")};
      `);
    const tk = $(program);

    const client = tk.client.getClient(DemoService);

    expect(client.name).toEqual("DemoServiceClient");
    expect(client.service).toEqual(DemoService);
    expect(client.type).toEqual(DemoService);
  });

  it("should preserve client object identity", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")};
      `);
    const tk = $(program);

    const client1 = tk.client.getClient(DemoService);
    const client2 = tk.client.getClient(DemoService);
    expect(client1).toBe(client2);
  });

  it("should get a flattened list of clients", async () => {
    const { DemoService, BarBaz, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")} {
        namespace Foo {
           namespace FooBaz {}
        }

        @test namespace Bar {
           interface ${t.interface("BarBaz")} {}
        }
      }
      `);
    const tk = $(program);

    const client = tk.client.getClient(DemoService);
    const flatClients = tk.client.flat(client);
    const barBaz = tk.client.getClient(BarBaz);
    expect(flatClients).toHaveLength(5);
    const barBazClient = flatClients.find((c) => c.type === barBaz.type);
    expect(barBazClient).toBeDefined();
  });
});

describe("getConstructor", () => {
  describe("credential parameter", () => {
    it("none", async () => {
      const { DemoService, program } = await Tester.compile(t.code`
        @service(#{
          title: "Widget Service",
        })
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);

      const client = tk.clientLibrary.listClients(DemoService)[0];
      const constructor = tk.client.getConstructor(client);
      // no overloads, should just be one
      expect(tk.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = tk.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      expect(tk.scalar.isString(params[0].type)).toBeTruthy();
    });
    it("apikey", async () => {
      const { DemoService, program } = await Tester.compile(t.code`
        @service(#{
          title: "Widget Service",
        })
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);

      const client = tk.clientLibrary.listClients(DemoService)[0];
      const constructor = tk.client.getConstructor(client);
      // no constructor overloads, should just be one
      expect(tk.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = tk.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(2);
      expect(params[0].name).toEqual("endpoint");
      expect(tk.scalar.isString(params[0].type)).toBeTruthy();
      const credParam = params[1];
      expect(credParam.name).toEqual("credential");
      ok(tk.literal.isString(credParam.type));
      expect(credParam.type.value).toEqual("apiKey");
    });

    it("bearer", async () => {
      /**
       * This test validates that:
       * - There are no overloads
       * - A single constructor with an endpoint parameter that is required
       * - A single constructor with a credential parameter that is required.
       */
      const { DemoService, program } = await Tester.compile(t.code`
        @service(#{
          title: "Widget Service",
        })
        @useAuth(OAuth2Auth<[{
          type: OAuth2FlowType.implicit;
          authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize";
          scopes: ["https://security.microsoft.com/.default"];
        }]>)
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);

      const client = tk.clientLibrary.listClients(DemoService)[0];
      const constructor = tk.client.getConstructor(client);
      // no constructor overloads, should just be one
      expect(tk.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = tk.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(2);
      expect(params[0].name).toEqual("endpoint");
      expect(tk.scalar.isString(params[0].type)).toBeTruthy();
      const credParam = params[1];
      expect(credParam.name).toEqual("credential");
      ok(tk.literal.isString(credParam.type));
      expect(credParam.type.value).toEqual("oauth2");
    });
  });
  describe("endpoint", () => {
    it("no servers", async () => {
      const { DemoService, program } = await Tester.compile(t.code`
        @service(#{
          title: "Widget Service",
        })
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);

      const client = tk.clientLibrary.listClients(DemoService)[0];
      const constructor = tk.client.getConstructor(client);
      // no overloads, should just be one
      expect(tk.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = tk.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      expect(tk.scalar.isString(params[0].type)).toBeTruthy();
    });
    it("one server, no params", async () => {
      const { DemoService, program } = await Tester.compile(t.code`
        @server("https://example.com", "The service endpoint")
        @service(#{
          title: "Widget Service",
        })
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);

      const client = tk.clientLibrary.listClients(DemoService)[0];
      const constructor = tk.client.getConstructor(client);
      expect(tk.operation.getOverloads(client, constructor)).toHaveLength(0);
      const params = tk.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      const clientDefaultValue = tk.modelProperty.getClientDefaultValue(client, params[0]);
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
      const { DemoService, program } = await Tester.compile(t.code`
        @server("https://example.com/{name}/foo", "My service url", { name: string })
        @service(#{
          title: "Widget Service",
        })
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);

      const client = tk.clientLibrary.listClients(DemoService)[0];
      const constructor = tk.client.getConstructor(client);

      // base operation.
      // The base operation needs to satisfy all overloads, so it should have the most parameters
      // In this test, the base operation should have the endpoint and name parameters both optional
      // in the base constructor.
      expect(constructor.returnType).toEqual(tk.intrinsic.void);
      const params = tk.operation.getClientSignature(client, constructor);
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
      expect(tk.operation.getOverloads(client, constructor)).toHaveLength(0);
    });
    it("one server with parameter named endpoint", async () => {
      /**
       * This test validates that:
       *  - There are no overloads
       *  - A constructor parameter named endpoint which maps to the template variable that is required but has a default value
       *  - A constructor parameter named _endpoint (due to collission) which has a default value which is the url template https://{endpoint}/foo
       */
      const { DemoService, program } = await Tester.compile(t.code`
        @server("https://{endpoint}/foo", "My service url", { endpoint: string })
        @service(#{
          title: "Widget Service",
        })
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);

      const client = tk.clientLibrary.listClients(DemoService)[0];
      const constructor = tk.client.getConstructor(client);

      expect(constructor.returnType).toEqual(tk.intrinsic.void);
      const params = tk.operation.getClientSignature(client, constructor);
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
      expect(tk.operation.getOverloads(client, constructor)).toHaveLength(0);
    });
    it("multiple servers", async () => {
      /**
       * This test validates that:
       *  - There are no overloads
       *  - The base constructor has a single endpoint parameter that is required
       *  - The endpoint parameter has a type of union including the 2 clientDefaultValues plus string.
       */

      const { DemoService, program } = await Tester.compile(t.code`
        @server("https://example.com", "The service endpoint")
        @server("https://example.org", "The service endpoint")
        @service(#{
          title: "Widget Service",
        })
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);
      const client = tk.clientLibrary.listClients(DemoService)[0];

      // There is a single constructor so no overloads.
      const overloads = tk.operation.getOverloads(client, tk.client.getConstructor(client));
      expect(overloads).toHaveLength(0);

      // The base constructor should have a single endpoint parameter that is required
      const baseConstructor = tk.client.getConstructor(client);
      const baseParams = tk.operation.getClientSignature(client, baseConstructor);
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
      expect(values[2].type).toEqual(tk.builtin.string);
    });
  });
});

describe("isPubliclyInitializable", () => {
  it("namespace", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")};
      `);
    const tk = $(program);

    const responses = tk.clientLibrary.listClients(DemoService);
    expect(responses).toHaveLength(1);
    expect(responses[0].name).toEqual("DemoServiceClient");
    expect(tk.client.isPubliclyInitializable(responses[0])).toBeTruthy();
  });
  it("nested namespace", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")} {
        namespace NestedService {};
      }
      `);
    const tk = $(program);

    const responses = tk.clientLibrary.listClients(DemoService);
    expect(responses).toHaveLength(1);
    expect(responses[0].name).toEqual("DemoServiceClient");
    expect(tk.client.isPubliclyInitializable(responses[0])).toBeTruthy();

    const subclients = tk.clientLibrary.listClients(responses[0]);
    expect(subclients).toHaveLength(1);
    expect(subclients[0].name).toEqual("NestedServiceClient");
    expect(tk.client.isPubliclyInitializable(subclients[0])).toBeTruthy();
  });
  it("nested interface", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")} {
        interface NestedInterface {};
      }
      `);
    const tk = $(program);

    const responses = tk.clientLibrary.listClients(DemoService);
    expect(responses).toHaveLength(1);
    expect(responses[0].name).toEqual("DemoServiceClient");
    expect(tk.client.isPubliclyInitializable(responses[0])).toBeTruthy();

    const subclients = tk.clientLibrary.listClients(responses[0]);
    expect(subclients).toHaveLength(1);
    expect(subclients[0].name).toEqual("NestedInterfaceClient");
    expect(tk.client.isPubliclyInitializable(subclients[0])).toBeFalsy();
  });
});

describe("listServiceOperations", () => {
  it("should list only operations defined in the spec", async () => {
    const { program } = await Tester.compile(t.code`
      op foo(): void;
     `);
    const tk = $(program);

    const namespace = tk.program.getGlobalNamespaceType();
    const client = tk.client.getClient(namespace);

    const operations = tk.client.listHttpOperations(client);

    expect(operations).toHaveLength(1);
    expect(operations[0].operation.name).toEqual("foo");
  });

  it("no operations", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")};
      `);
    const tk = $(program);
    const client = tk.clientLibrary.listClients(DemoService)[0];
    const operations = tk.client.listHttpOperations(client);
    expect(operations).toHaveLength(0);
  });
  it("nested namespace", async () => {
    const { DemoService, NestedService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
       namespace ${t.namespace("DemoService")} {
        @route("demo")
        op demoServiceOp(): void;
        namespace ${t.namespace("NestedService")} {
          @route("nested")
          op nestedServiceOp(): void;
        };
      }
      `);
    const tk = $(program);

    const demoServiceClient = tk.clientLibrary.listClients(DemoService)[0];
    expect(tk.client.listHttpOperations(demoServiceClient)).toHaveLength(1);
    expect(tk.client.listHttpOperations(demoServiceClient)[0].operation.name).toEqual(
      "demoServiceOp",
    );

    const nestedServiceClient = tk.clientLibrary.listClients(NestedService)[0];
    expect(tk.client.listHttpOperations(nestedServiceClient)).toHaveLength(1);
    expect(tk.client.listHttpOperations(nestedServiceClient)[0].operation.name).toEqual(
      "nestedServiceOp",
    );
  });
});

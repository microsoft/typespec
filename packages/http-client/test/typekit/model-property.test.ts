import { StringValue } from "@typespec/compiler";
import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { ok } from "assert";
import { describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { Tester } from "../test-host.js";

describe("getCredentialAuth", () => {
  it("should return the correct http scheme", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
      namespace ${t.namespace("DemoService")};
      `);
    const tk = $(program);

    const client = tk.client.getClient(DemoService);
    const constructor = tk.client.getConstructor(client);
    const parameters = tk.operation.getClientSignature(client, constructor);

    const credential = parameters.find((p) => tk.modelProperty.isCredential(p));
    expect(credential).toBeDefined();

    const auth = tk.modelProperty.getCredentialAuth(credential!)!;
    expect(auth).toBeDefined();
    expect(auth).toHaveLength(1);
    expect(auth[0].type).toEqual("apiKey");
  });

  it("should return the correct http schemes", async () => {
    const { program, DemoService } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key"> | OAuth2Auth<[{
        type: OAuth2FlowType.implicit;
        authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize";
        scopes: ["https://security.microsoft.com/.default"];
      }]>)
      namespace ${t.namespace("DemoService")};
      `);
    const tk = $(program);

    const client = tk.client.getClient(DemoService);
    const constructor = tk.client.getConstructor(client);
    const parameters = tk.operation.getClientSignature(client, constructor);

    const credential = parameters.find((p) => tk.modelProperty.isCredential(p));
    expect(credential).toBeDefined();

    const auth = tk.modelProperty.getCredentialAuth(credential!)!;
    expect(auth).toBeDefined();
    expect(auth).toHaveLength(2);
    expect(auth[0].type).toEqual("apiKey");
    expect(auth[1].type).toEqual("oauth2");
  });
});

describe("isOnClient", () => {
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
      const params = tk.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      expect(tk.modelProperty.isOnClient(client, params[0])).toBe(true);
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
      const params = tk.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      expect(tk.modelProperty.isOnClient(client, params[0])).toBe(true);
    });
    it("one server with parameter", async () => {
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

      // base operation
      const params = tk.operation.getClientSignature(client, constructor);
      const nameParam = params.find((p) => p.name === "name");
      const endpointParam = params.find((p) => p.name === "endpoint");
      expect(nameParam).toBeDefined();
      expect(nameParam?.defaultValue).toBeUndefined();
      expect(endpointParam).toBeDefined();

      const endpointDefaultValue = endpointParam?.defaultValue as StringValue;
      expect(endpointDefaultValue.value).toEqual("https://example.com/{name}/foo");
      ok(nameParam);
      expect(tk.modelProperty.isOnClient(client, nameParam)).toBe(true);

      // should have no overloads
      expect(tk.operation.getOverloads(client, constructor)).toHaveLength(0);
    });
  });
  describe("credential", () => {
    it("apikey", async () => {
      const { DemoService, program } = await Tester.compile(t.code`
        @service(#{
          title: "Widget Service",
        })
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
        namespace ${t.namespace("DemoService")};
        `);
      const tk = $(program);

      const client = tk.client.getClient(DemoService);
      const constructor = tk.client.getConstructor(client);
      // no constructor overloads, should just be one
      const credential = tk.operation
        .getClientSignature(client, constructor)
        .find((p) => tk.modelProperty.isCredential(p));
      ok(credential);
      expect(tk.modelProperty.isOnClient(client, credential)).toBe(true);
    });
    it("bearer", async () => {
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
      const credential = tk.operation
        .getClientSignature(client, constructor)
        .find((p) => tk.modelProperty.isCredential(p));
      ok(credential);
      expect(tk.modelProperty.isOnClient(client, credential)).toBe(true);
    });
  });
});

describe("isCredential", () => {
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
    const credential = tk.operation
      .getClientSignature(client, constructor)
      .find((p) => tk.modelProperty.isCredential(p));
    ok(credential);
    expect(tk.modelProperty.isCredential(credential)).toBe(true);
  });
  it("bearer", async () => {
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
    const credential = tk.operation
      .getClientSignature(client, constructor)
      .find((p) => tk.modelProperty.isCredential(p));
    ok(credential);
    expect(tk.modelProperty.isCredential(credential)).toBe(true);
  });
});

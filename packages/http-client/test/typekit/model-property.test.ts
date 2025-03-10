import { Namespace, StringValue } from "@typespec/compiler";
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

describe("getCredentialAuth", () => {
  it("should return the correct http scheme", async () => {
    const { DemoService } = (await runner.compile(`
      @service(#{
        title: "Widget Service",
      })
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
      @test namespace DemoService;
      `)) as { DemoService: Namespace };

    const client = $.client.getClient(DemoService);
    const constructor = $.client.getConstructor(client);
    const parameters = $.operation.getClientSignature(client, constructor);

    const credential = parameters.find((p) => $.modelProperty.isCredential(p));
    expect(credential).toBeDefined();

    const auth = $.modelProperty.getCredentialAuth(credential!)!;
    expect(auth).toBeDefined();
    expect(auth).toHaveLength(1);
    expect(auth[0].type).toEqual("apiKey");
  });

  it("should return the correct http schemes", async () => {
    const { DemoService } = (await runner.compile(`
      @service(#{
        title: "Widget Service",
      })
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key"> | OAuth2Auth<[{
        type: OAuth2FlowType.implicit;
        authorizationUrl: "https://login.microsoftonline.com/common/oauth2/authorize";
        scopes: ["https://security.microsoft.com/.default"];
      }]>)
      @test namespace DemoService;
      `)) as { DemoService: Namespace };

    const client = $.client.getClient(DemoService);
    const constructor = $.client.getConstructor(client);
    const parameters = $.operation.getClientSignature(client, constructor);

    const credential = parameters.find((p) => $.modelProperty.isCredential(p));
    expect(credential).toBeDefined();

    const auth = $.modelProperty.getCredentialAuth(credential!)!;
    expect(auth).toBeDefined();
    expect(auth).toHaveLength(2);
    expect(auth[0].type).toEqual("apiKey");
    expect(auth[1].type).toEqual("oauth2");
  });
});

describe("isOnClient", () => {
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
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      expect($.modelProperty.isOnClient(client, params[0])).toBe(true);
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
      const params = $.operation.getClientSignature(client, constructor);
      expect(params).toHaveLength(1);
      expect(params[0].name).toEqual("endpoint");
      expect($.modelProperty.isOnClient(client, params[0])).toBe(true);
    });
    it("one server with parameter", async () => {
      const { DemoService } = (await runner.compile(`
        @server("https://example.com/{name}/foo", "My service url", { name: string })
        @service(#{
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const constructor = $.client.getConstructor(client);

      // base operation
      const params = $.operation.getClientSignature(client, constructor);
      const nameParam = params.find((p) => p.name === "name");
      const endpointParam = params.find((p) => p.name === "endpoint");
      expect(nameParam).toBeDefined();
      expect(nameParam?.defaultValue).toBeUndefined();
      expect(endpointParam).toBeDefined();

      const endpointDefaultValue = endpointParam?.defaultValue as StringValue;
      expect(endpointDefaultValue.value).toEqual("https://example.com/{name}/foo");
      ok(nameParam);
      expect($.modelProperty.isOnClient(client, nameParam)).toBe(true);

      // should have no overloads
      expect($.operation.getOverloads(client, constructor)).toHaveLength(0);
    });
  });
  describe("credential", () => {
    it("apikey", async () => {
      const { DemoService } = (await runner.compile(`
        @service(#{
          title: "Widget Service",
        })
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-ms-api-key">)
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.client.getClient(DemoService);
      const constructor = $.client.getConstructor(client);
      // no constructor overloads, should just be one
      const credential = $.operation
        .getClientSignature(client, constructor)
        .find((p) => $.modelProperty.isCredential(p));
      ok(credential);
      expect($.modelProperty.isOnClient(client, credential)).toBe(true);
    });
    it("bearer", async () => {
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
      const credential = $.operation
        .getClientSignature(client, constructor)
        .find((p) => $.modelProperty.isCredential(p));
      ok(credential);
      expect($.modelProperty.isOnClient(client, credential)).toBe(true);
    });
  });
});

describe("isCredential", () => {
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
    const credential = $.operation
      .getClientSignature(client, constructor)
      .find((p) => $.modelProperty.isCredential(p));
    ok(credential);
    expect($.modelProperty.isCredential(credential)).toBe(true);
  });
  it("bearer", async () => {
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
    const credential = $.operation
      .getClientSignature(client, constructor)
      .find((p) => $.modelProperty.isCredential(p));
    ok(credential);
    expect($.modelProperty.isCredential(credential)).toBe(true);
  });
});

import { Namespace } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { ok } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { createTypespecHttpClientLibraryTestRunner } from "../test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTypespecHttpClientLibraryTestRunner();
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

// describe("getEndpoint", () => {
//   it("no servers", async () => {
//     const { DemoService } = (await runner.compile(`
//       @service({
//         title: "Widget Service",
//       })
//       @test namespace DemoService;
//       `)) as { DemoService: Namespace };

//     const client = $.clientLibrary.listClients(DemoService)[0];
//     const urlTemplate = $.client.getUrlTemplate(client);
//     ok($.literal.isString(endpoint));
//     expect(endpoint.value).toEqual("{endpoint}");
//   });
//   it("one server", async () => {
//     const { DemoService } = (await runner.compile(`
//       @server("https://example.com", "The service endpoint")
//       @service({
//         title: "Widget Service",
//       })
//       @test namespace DemoService;
//       `)) as { DemoService: Namespace };

//     const client = $.clientLibrary.listClients(DemoService)[0];
//     const endpoint = $.client.getEndpoint(client);
//     ok($.literal.isString(endpoint));
//     expect(endpoint.value).toEqual("https://example.com");
//   });
//   it("one server with parameter", async () => {
//     const { DemoService } = (await runner.compile(`
//       @server("https://example.com/{name}/foo", "My service url", { name: string })
//       @service({
//         title: "Widget Service",
//       })
//       @test namespace DemoService;
//       `)) as { DemoService: Namespace };
//     const client = $.clientLibrary.listClients(DemoService)[0];
//     const endpoint = $.client.getEndpoint(client);
//     ok($.literal.isString(endpoint));
//     expect(endpoint.value).toEqual("https://example.com/{name}/foo");
//   });
//   it("multiple servers", async () => {
//     const { DemoService } = (await runner.compile(`
//       @server("https://example.com", "The service endpoint")
//       @server("https://example.org", "The service endpoint")
//       @service({
//         title: "Widget Service",
//       })
//       @test namespace DemoService;
//       `)) as { DemoService: Namespace };

//     const client = $.clientLibrary.listClients(DemoService)[0];
//     const endpoint = $.client.getEndpoint(client);
//     ok($.union.is(endpoint));
//     const variants = [...endpoint.variants.values()];
//     expect(variants).toHaveLength(2);
//     const com = variants.find(
//       (v) => $.literal.isString(v.type) && v.type.value === "https://example.com",
//     );
//     ok(com);
//     const org = variants.find(
//       (v) => $.literal.isString(v.type) && v.type.value === "https://example.org",
//     );
//     ok(org);
//   });
// });

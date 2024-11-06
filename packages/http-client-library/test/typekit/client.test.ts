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

describe("getParameters", () => {
  describe("credential parameter", () => {
    it("none", async () => {
      const { DemoService } = (await runner.compile(`
        @service({
          title: "Widget Service",
        })
        @test namespace DemoService;
        `)) as { DemoService: Namespace };

      const client = $.clientLibrary.listClients(DemoService)[0];
      const params = $.client.getParameters(client);
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
      const params = $.client.getParameters(client);
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
      const params = $.client.getParameters(client);
      expect(params).toHaveLength(2);
      expect(params[0].name).toEqual("endpoint");
      expect($.scalar.isString(params[0].type)).toBeTruthy();
      const credParam = params[1];
      expect(credParam.name).toEqual("credential");
      ok($.literal.isString(credParam.type));
      expect(credParam.type.value).toEqual("oauth2");
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

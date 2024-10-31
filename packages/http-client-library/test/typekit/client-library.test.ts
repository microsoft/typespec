import { Namespace } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { beforeEach, describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { createTypespecHttpClientLibraryTestRunner } from "../test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTypespecHttpClientLibraryTestRunner();
});

describe("listNamespaces", () => {
  it("basic", async () => {
    await runner.compile(`
      @service({
        title: "Widget Service",
      })
        namespace DemoService;
      `);
    expect($.clientLibrary.listNamespaces()).toHaveLength(1);
    expect($.clientLibrary.listNamespaces()[0].name).toEqual("DemoService");
  });

  it("nested", async () => {
    // we only want to return the top level namespaces
    await runner.compile(`
      @service({
        title: "Widget Service",
      })
      namespace DemoService {
        namespace NestedService {
          namespace NestedNestedService {
          } 
        }
      }
    `);
    expect($.clientLibrary.listNamespaces()).toHaveLength(1);
    expect($.clientLibrary.listNamespaces()[0].name).toEqual("DemoService");
  });
});

describe("listClients", () => {
  it("should get the client", async () => {
    const { DemoService } = (await runner.compile(`
      @service({
        title: "Widget Service",
      })
      @test namespace DemoService;
      `)) as { DemoService: Namespace };

    const responses = $.clientLibrary.listClients(DemoService);
    expect(responses).toHaveLength(1);
    expect(responses[0].name).toEqual("DemoServiceClient");
  });
});

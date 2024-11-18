import { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { $ } from "@typespec/compiler/typekit";
import { createTypespecHttpClientLibraryTestRunner } from "../test-host.js";
import { Namespace } from "@typespec/compiler";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTypespecHttpClientLibraryTestRunner();
});

describe("isOnClient", () => {
  it("endpoint from no servers", async () => {
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
    expect($.modelProperty.isOnClient(client, params[0])).toBe(true);
  });
});

describe("credential", () => {});

import { Namespace } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/experimental/typekit";
import { beforeEach, expect, it } from "vitest";
import { createTypespecHttpClientLibraryAzureTestRunner } from "./../test-host.js";

import "@typespec/http-client-library/typekit";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTypespecHttpClientLibraryAzureTestRunner();
});

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

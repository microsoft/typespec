import { t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { describe, expect, it } from "vitest";
import "../../src/typekit/index.js";
import { Tester } from "../test-host.js";

describe("listNamespaces", () => {
  it("basic", async () => {
    const { program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
        namespace DemoService;
      `);
    const tk = $(program);

    expect(tk.clientLibrary.listNamespaces()).toHaveLength(1);
    expect(tk.clientLibrary.listNamespaces()[0].name).toEqual("DemoService");
  });

  it("nested", async () => {
    // we only want to return the top level namespaces
    const { program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace DemoService {
        namespace NestedService {
          namespace NestedNestedService {
          } 
        }
      }
    `);
    const tk = $(program);

    expect(tk.clientLibrary.listNamespaces()).toHaveLength(1);
    expect(tk.clientLibrary.listNamespaces()[0].name).toEqual("DemoService");

    const subNamespaces = tk.clientLibrary.listNamespaces(tk.clientLibrary.listNamespaces()[0]);
    expect(subNamespaces).toHaveLength(1);
    expect(subNamespaces[0].name).toEqual("NestedService");

    const subSubNamespaces = tk.clientLibrary.listNamespaces(subNamespaces[0]);
    expect(subSubNamespaces).toHaveLength(1);
    expect(subSubNamespaces[0].name).toEqual("NestedNestedService");
  });
});

describe("listClients", () => {
  it("should only get clients for defined namespaces in the spec", async () => {
    const { program } = await Tester.compile(t.code`
           op foo(): void;
          `);
    const tk = $(program);

    const namespace = tk.program.getGlobalNamespaceType();
    const client = tk.client.getClient(namespace);

    const clients = tk.clientLibrary.listClients(client);

    expect(clients).toHaveLength(0);
  });

  it("should get the client", async () => {
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
  });
  it("get subclients", async () => {
    const { DemoService, program } = await Tester.compile(t.code`
      @service(#{
        title: "Widget Service",
      })
      namespace ${t.namespace("DemoService")} {
        namespace ${t.namespace("NestedService")} {};
      }
      `);
    const tk = $(program);

    const responses = tk.clientLibrary.listClients(DemoService);
    expect(responses).toHaveLength(1);
    expect(responses[0].name).toEqual("DemoServiceClient");

    const subClients = tk.clientLibrary.listClients(responses[0]);
    expect(subClients).toHaveLength(1);
    expect(subClients[0].name).toEqual("NestedServiceClient");
  });
});

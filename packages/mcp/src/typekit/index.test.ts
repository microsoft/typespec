import { Tester } from "#test/tester.js";
import { expectTypeEquals, t } from "@typespec/compiler/testing";
import { $ } from "@typespec/compiler/typekit";
import { describe, expect, it } from "vitest";
import "./index.js";

describe("$.mcp.servers.list()", () => {
  describe("discovery", () => {
    it("as a top level namespace", async () => {
      const { program, Service } = await Tester.compile(t.code`
      @mcpServer
      namespace ${t.namespace("Service")};
    `);

      const server = $(program).mcp.servers.list();
      expect(server).toHaveLength(1);
      expectTypeEquals(server[0].container, Service);
    });

    it("as a top level interface", async () => {
      const { program, Service } = await Tester.compile(t.code`
      @mcpServer
      interface ${t.interface("Service")} {}
    `);

      const server = $(program).mcp.servers.list();
      expect(server).toHaveLength(1);
      expectTypeEquals(server[0].container, Service);
    });

    it("as a nested namespace", async () => {
      const { program, Service } = await Tester.compile(t.code`
      @mcpServer
      namespace Org.${t.namespace("Service")};
    `);

      const server = $(program).mcp.servers.list();
      expect(server).toHaveLength(1);
      expectTypeEquals(server[0].container, Service);
    });

    it("as a nested interface", async () => {
      const { program, Service } = await Tester.compile(t.code`
      namespace Org;

      @mcpServer
      interface ${t.interface("Service")} {}
    `);

      const server = $(program).mcp.servers.list();
      expect(server).toHaveLength(1);
      expectTypeEquals(server[0].container, Service);
    });

    it("collect multiple", async () => {
      const { program, Service1, Service2 } = await Tester.compile(t.code`
      @mcpServer
      namespace ${t.namespace("Service1")} {}
      namespace Group {
        @mcpServer
        interface ${t.interface("Service2")} {}
      }
    `);

      const server = $(program).mcp.servers.list();
      expect(server).toHaveLength(2);
      expectTypeEquals(server[0].container, Service1);
      expectTypeEquals(server[1].container, Service2);
    });
  });

  it("set properties", async () => {
    const { program } = await Tester.compile(t.code`
      @mcpServer(#{
        name: "MyService",
        instructions: "This is a test service",
        version: "0.1.0",
      })
      interface Service {}
    `);

    const server = $(program).mcp.servers.list();
    expect(server).toHaveLength(1);
    expect(server[0]).toMatchObject({
      name: "MyService",
      instructions: "This is a test service",
      version: "0.1.0",
    });
  });
});

import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import { diagnoseOpenApiFor, openApiFor } from "./test-host.js";

describe("openapi3: servers", () => {
  it("set a basic server", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @server("https://example.com", "Main server")
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Main server",
        url: "https://example.com",
        variables: {},
      },
    ]);
  });

  it("emit diagnostic when parameter is not a string", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @service({title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {region: int32})
      namespace MyService {}
      `,
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/invalid-server-variable",
      message:
        "Server variable 'region' must be assignable to 'string'. It must either be a string, enum of string or union of strings.",
    });
  });

  it("emit diagnostic when parameter is an enum of different types", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @service({title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {region: Region})
      namespace MyService {}

      enum Region {
        westus, 
        eastus: 123,
      }
      `,
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/invalid-server-variable",
      message:
        "Server variable 'region' must be assignable to 'string'. It must either be a string, enum of string or union of strings.",
    });
  });

  it("emit diagnostic when parameter is a union of non string types", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @service({title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {region: string | int32})
      namespace MyService {}
      `,
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/invalid-server-variable",
      message:
        "Server variable 'region' must be assignable to 'string'. It must either be a string, enum of string or union of strings.",
    });
  });

  it("set a server with parameters", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @server("https://{account}.{region}.example.com", "Regional account endpoint", {region: string, account: string})
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Regional account endpoint",
        url: "https://{account}.{region}.example.com",
        variables: {
          account: { default: "" },
          region: { default: "" },
        },
      },
    ]);
  });

  it("set a server with parameters with defaults", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @server("https://{account}.{region}.example.com", "Regional account endpoint", {
        region?: string = "westus", 
        account?: string = "default",
      })
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Regional account endpoint",
        url: "https://{account}.{region}.example.com",
        variables: {
          account: { default: "default" },
          region: { default: "westus" },
        },
      },
    ]);
  });

  it("set a server with parameters with doc", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        @doc("Region name")
        region: string,
      })
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Regional account endpoint",
        url: "https://{region}.example.com",
        variables: {
          region: { default: "", description: "Region name" },
        },
      },
    ]);
  });

  it("set a server with parameters with extensions", async () => {
    const res = await openApiFor(
      `
      @service({title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        @extension("x-custom", "Foo")
        region: string,
      })
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Regional account endpoint",
        url: "https://{region}.example.com",
        variables: {
          region: { default: "", "x-custom": "Foo" },
        },
      },
    ]);
  });

  it("set a server with enum properties", async () => {
    const res = await openApiFor(
      `
      enum Region { westus, eastus }
      @service({title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        region: Region, 
      })
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Regional account endpoint",
        url: "https://{region}.example.com",
        variables: {
          region: { default: "", enum: ["westus", "eastus"] },
        },
      },
    ]);
  });

  it("set a server with string literal", async () => {
    const res = await openApiFor(
      `
      enum Region {  }
      @service({title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        region: "westus", 
      })
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Regional account endpoint",
        url: "https://{region}.example.com",
        variables: {
          region: { default: "", enum: ["westus"] },
        },
      },
    ]);
  });

  it("set a server with unions type", async () => {
    const res = await openApiFor(
      `
      enum Region {  }
      @service({title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        region: "westus" | "eastus", 
      })
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Regional account endpoint",
        url: "https://{region}.example.com",
        variables: {
          region: { default: "", enum: ["westus", "eastus"] },
        },
      },
    ]);
  });
  it("set multiple servers", async () => {
    const res = await openApiFor(
      `
        @service
        @server("https://example1.com", "Main server1")
        @server("https://example2.com", "Main server2")
        namespace MyService {}
        `,
    );
    deepStrictEqual(res.servers, [
      {
        description: "Main server2",
        url: "https://example2.com",
        variables: {},
      },
      {
        description: "Main server1",
        url: "https://example1.com",
        variables: {},
      },
    ]);
  });
});

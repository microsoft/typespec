import { deepStrictEqual } from "assert";
import { openApiFor } from "./test-host.js";

describe("openapi3: servers", () => {
  it("set a basic server", async () => {
    const res = await openApiFor(
      `
      @serviceTitle("My service")
      @server("https://example.com", "Main server")
      namespace MyService {}
      `
    );
    deepStrictEqual(res.servers, [
      {
        description: "Main server",
        url: "https://example.com",
        variables: {},
      },
    ]);
  });

  it("set a server with parameters", async () => {
    const res = await openApiFor(
      `
      @serviceTitle("My service")
      @server("https://{account}.{region}.example.com", "Regional account endpoint", {region: string, account: string})
      namespace MyService {}
      `
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
      @serviceTitle("My service")
      @server("https://{account}.{region}.example.com", "Regional account endpoint", {
        region?: string = "westus", 
        account?: string = "default",
      })
      namespace MyService {}
      `
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
      @serviceTitle("My service")
      @server("https://{region}.example.com", "Regional account endpoint", {
        @doc("Region name")
        region: string,
      })
      namespace MyService {}
      `
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

  it("set a server with enum properties", async () => {
    const res = await openApiFor(
      `
      enum Region { westus, eastus }
      @serviceTitle("My service")
      @server("https://{region}.example.com", "Regional account endpoint", {
        region: Region, 
      })
      namespace MyService {}
      `
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
});

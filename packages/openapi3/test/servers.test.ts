import { expectDiagnostics } from "@typespec/compiler/testing";
import { deepStrictEqual } from "assert";
import { it } from "vitest";
import { emitOpenApiWithDiagnostics, TesterWithVersioning } from "./test-host.js";
import { supportedVersions, worksFor } from "./works-for.js";

worksFor(supportedVersions, ({ diagnoseOpenApiFor, openApiFor, version: specVersion }) => {
  // OpenAPI 3.0 only says that a server variable default should be one of its enum values.
  const missingDefaultWarnings = (name: string) =>
    specVersion === "3.0.0"
      ? []
      : [
          {
            code: "@typespec/openapi3/missing-server-variable-default",
            severity: "warning" as const,
            message: `Server variable '${name}' has no default, but OpenAPI ${specVersion} requires its default to be one of its enum values. Set a default on the parameter.`,
          },
        ];

  it("set a basic server(url)", async () => {
    const res = await openApiFor(
      `
      @service(#{title: "My service"})
      @server("https://example.com")
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers, [
      {
        url: "https://example.com",
        variables: {},
      },
    ]);
  });

  it("set a basic server(url and desc)", async () => {
    const res = await openApiFor(
      `
      @service(#{title: "My service"})
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
      @service(#{title: "My service"})
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
      @service(#{title: "My service"})
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

  it("accepts an enum whose numeric members are all encoded as strings", async () => {
    const [res, diagnostics] = await emitOpenApiWithDiagnostics(
      `
      @service(#{title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {region: Region})
      namespace MyService {}

      enum Region {
        @encodedName("application/json", "westus")
        westUs: 1,
        @encodedName("application/json", "eastus")
        eastUs: 2,
      }
      `,
      { "openapi-versions": [specVersion] },
    );
    expectDiagnostics(diagnostics, missingDefaultWarnings("region"));
    deepStrictEqual(res.servers?.[0].variables?.region?.enum, ["westus", "eastus"]);
  });

  it("emit diagnostic when a numeric enum member is left unencoded", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @service(#{title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {region: Region})
      namespace MyService {}

      enum Region {
        @encodedName("application/json", "westus")
        westUs: 1,
        eastUs: 2,
      }
      `,
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/openapi3/invalid-server-variable",
    });
  });

  it("emit diagnostic when parameter is a union of non string types", async () => {
    const diagnostics = await diagnoseOpenApiFor(
      `
      @service(#{title: "My service"})
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
      @service(#{title: "My service"})
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
      @service(#{title: "My service"})
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
      @service(#{title: "My service"})
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
      @service(#{title: "My service"})
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
    const [res, diagnostics] = await emitOpenApiWithDiagnostics(
      `
      enum Region { westus, eastus }
      @service(#{title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        region: Region, 
      })
      namespace MyService {}
      `,
      { "openapi-versions": [specVersion] },
    );
    expectDiagnostics(diagnostics, missingDefaultWarnings("region"));
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

  it("set a server with enum properties with a default", async () => {
    const res = await openApiFor(
      `
      enum Region { westus, eastus }
      @service(#{title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        region?: Region = Region.eastus,
      })
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers[0].variables, {
      region: { default: "eastus", enum: ["westus", "eastus"] },
    });
  });

  it("set a server with string literal", async () => {
    const [res, diagnostics] = await emitOpenApiWithDiagnostics(
      `
      enum Region {  }
      @service(#{title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        region: "westus", 
      })
      namespace MyService {}
      `,
      { "openapi-versions": [specVersion] },
    );
    expectDiagnostics(diagnostics, missingDefaultWarnings("region"));
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
    const [res, diagnostics] = await emitOpenApiWithDiagnostics(
      `
      enum Region {  }
      @service(#{title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        region: "westus" | "eastus", 
      })
      namespace MyService {}
      `,
      { "openapi-versions": [specVersion] },
    );
    expectDiagnostics(diagnostics, missingDefaultWarnings("region"));
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

  it("set a server with unions type with a default", async () => {
    const res = await openApiFor(
      `
      @service(#{title: "My service"})
      @server("https://{region}.example.com", "Regional account endpoint", {
        region?: "westus" | "eastus" = "eastus",
      })
      namespace MyService {}
      `,
    );
    deepStrictEqual(res.servers[0].variables, {
      region: { default: "eastus", enum: ["westus", "eastus"] },
    });
  });

  it("warns once for a server variable without a default in a versioned service", async () => {
    const [{ outputs }, diagnostics] = await TesterWithVersioning.compileAndDiagnose(
      `
      @versioned(Versions)
      @service(#{title: "My service"})
      @server("{endpoint}/{apiVersion}", "Versioned endpoint", {
        endpoint: url,
        apiVersion: Versions,
      })
      namespace MyService {
        enum Versions { v1: "2024-01-01", v2: "2025-01-01" }
      }
      `,
      {
        compilerOptions: {
          options: {
            "@typespec/openapi3": {
              "openapi-versions": [specVersion],
              "output-file": "{version}.openapi.json",
            },
          },
        },
      },
    );
    expectDiagnostics(diagnostics, missingDefaultWarnings("apiVersion"));
    for (const version of ["2024-01-01", "2025-01-01"]) {
      const document = JSON.parse(outputs[`${version}.openapi.json`]);
      deepStrictEqual(document.servers[0].variables, {
        endpoint: { default: "" },
        apiVersion: { default: "", enum: ["2024-01-01", "2025-01-01"] },
      });
    }
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

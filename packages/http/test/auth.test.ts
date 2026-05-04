import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { getAuthenticationForOperation, resolveAuthentication } from "../src/auth.js";
import { getAllHttpServices } from "../src/index.js";
import { Tester } from "./test-host.js";

describe("per operation authentication", () => {
  /** Test function that will expect api key auth only and return the name of the one selected */
  async function getTestOperationApiKeyAuthName(code: string) {
    const { test, program } = await Tester.compile(code);

    ok(
      test.entityKind === "Type" && test.kind === "Operation",
      "Should have operation called test marked with @test",
    );
    const auth = getAuthenticationForOperation(program, test);
    const scheme = auth?.options[0].schemes[0];
    strictEqual(scheme?.type, "apiKey");
    return scheme.name;
  }

  it("use explicit value on operation", async () => {
    const auth = await getTestOperationApiKeyAuthName(`
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-for-namespace">)
      namespace MyNamespace {
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-for-interface">)
        interface MyInterface {
          @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-for-op">)
          @test op test(): void;
        }
      }
      `);

    expect(auth).toEqual("x-for-op");
  });

  it("go up to interface", async () => {
    const auth = await getTestOperationApiKeyAuthName(`
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-for-namespace">)
      namespace MyNamespace {
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-for-interface">)
        interface MyInterface {
          @test op test(): void;
        }
      }
      `);

    expect(auth).toEqual("x-for-interface");
  });

  it("go up to first namespace", async () => {
    const auth = await getTestOperationApiKeyAuthName(`
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-for-namespace">)
      namespace MyNamespace {
        @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-for-sub-namespace">)
        namespace MySubNamespace {
          interface MyInterface {
            @test op test(): void;
          }
        }
      }
      `);

    expect(auth).toEqual("x-for-sub-namespace");
  });

  it("go up to top namespace", async () => {
    const auth = await getTestOperationApiKeyAuthName(`
      @useAuth(ApiKeyAuth<ApiKeyLocation.header, "x-for-namespace">)
      namespace MyNamespace {
        namespace MySubNamespace {
          interface MyInterface {
            @test op test(): void;
          }
        }
      }
      `);

    expect(auth).toEqual("x-for-namespace");
  });
});

it("should deduplicate scopes when multiple flows share the same scopes", async () => {
  const { program } = await Tester.compile(`
    model oauth<Scopes extends string[]>
      is OAuth2Auth<
        [
          {
            type: OAuth2FlowType.authorizationCode;
            authorizationUrl: "https://example.org/oauth2/v2.0/authorize";
            tokenUrl: "https://example.org/oauth2/v2.0/token";
            refreshUrl: "https://example.org/oauth2/v2.0/token";
          },
          {
            type: OAuth2FlowType.clientCredentials;
            tokenUrl: "https://example.org/oauth2/v2.0/token";
          }
        ],
        Scopes
      >;

    @useAuth(oauth<["api:read"]>)
    @test op testOp(): void;
  `);

  const [services] = getAllHttpServices(program);
  const httpService = services[0];
  const auth = resolveAuthentication(httpService);

  // Get the operation auth
  const testOp = httpService.operations.find((op) => op.operation.name === "testOp");
  ok(testOp, "Should find test operation");

  const operationAuth = auth.operationsAuth.get(testOp.operation);
  ok(operationAuth, "Should have operation auth");

  // Check that we have OAuth2 auth reference
  const oauthRef = operationAuth.options[0].all[0];
  strictEqual(oauthRef.kind, "oauth2");

  if (oauthRef.kind === "oauth2") {
    // Verify scopes are deduplicated - should only have "api:read" once
    expect(oauthRef.scopes).toEqual(["api:read"]);
    expect(oauthRef.scopes).toHaveLength(1);
  }
});

import { ok, strictEqual } from "assert";
import { describe, expect, it } from "vitest";
import { getAuthenticationForOperation } from "../src/auth.js";
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

import { TestHost } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { createModel } from "../../src/lib/client-model-builder.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test auth", () => {
  let runner: TestHost;

  beforeEach(async () => {
    runner = await createEmitterTestHost();
  });

  it("cookie header is not supported", async () => {
    const program = await typeSpecCompile(
      `
            op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(ApiKeyAuth<ApiKeyLocation.cookie, "api-key-name">)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    const noAuthDiagnostic = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-auth",
    );
    ok(noAuthDiagnostic);
    strictEqual(
      noAuthDiagnostic.message,
      "Only header is supported for ApiKey authentication. cookie is not supported.",
    );
    strictEqual(root.Auth, undefined); // we do not support it therefore it falls back to undefined
  });

  it("query header is not supported", async () => {
    const program = await typeSpecCompile(
      `
            op test(): NoContentResponse;
      `,
      runner,
      {
        AuthDecorator: `@useAuth(ApiKeyAuth<ApiKeyLocation.query, "api-key-name">)`,
      },
    );
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const root = createModel(sdkContext);
    const diagnostics = context.program.diagnostics;

    const noAuthDiagnostic = diagnostics.find(
      (d) => d.code === "@typespec/http-client-csharp/unsupported-auth",
    );
    ok(noAuthDiagnostic);
    strictEqual(
      noAuthDiagnostic.message,
      "Only header is supported for ApiKey authentication. query is not supported.",
    );
    strictEqual(root.Auth, undefined); // we do not support it therefore it falls back to undefined
  });
});

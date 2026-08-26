vi.resetModules();

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GenerateOptions } from "../../src/emit-generate.js";
import type { CSharpEmitterContext } from "../../src/sdk-context.js";

// Mock @typespec/compiler to provide resolvePath
vi.mock("@typespec/compiler", () => ({
  resolvePath: (...segments: string[]) => segments.join("/"),
}));

// Create a mock context with a writable host
function createMockContext(): CSharpEmitterContext {
  return {
    program: {
      host: {
        writeFile: vi.fn(),
      },
    },
  } as unknown as CSharpEmitterContext;
}

const defaultOptions: GenerateOptions = {
  outputFolder: "/output",
  generatorName: "ScmCodeModelGenerator",
  packageName: "TestPackage",
  newProject: false,
  debug: false,
  saveInputs: false,
};

function createMockResponse(body: any, opts?: { ok?: boolean; status?: number }) {
  return {
    ok: opts?.ok ?? true,
    status: opts?.status ?? 200,
    headers: new Headers({ "content-type": "application/json" }),
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe("emit-generate.browser", () => {
  let generate: typeof import("../../src/emit-generate.browser.js").generate;

  beforeEach(async () => {
    vi.resetModules();
    generate = (await import("../../src/emit-generate.browser.js")).generate;
  });

  it("should POST to the server URL", async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ files: [] }));

    const ctx = createMockContext();
    await generate(ctx, '{"model":"test"}', '{"config":"test"}', defaultOptions);

    expect(fetch).toHaveBeenCalledWith(
      "https://csharp-playground-server.azurewebsites.net/generate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("should send codeModel, configuration, and generatorName in request body", async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ files: [] }));

    const ctx = createMockContext();
    await generate(ctx, '{"model":"data"}', '{"namespace":"Test"}', {
      ...defaultOptions,
      generatorName: "CustomGenerator",
    });

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]!.body as string);
    expect(body).toEqual({
      codeModel: '{"model":"data"}',
      configuration: '{"namespace":"Test"}',
      generatorName: "CustomGenerator",
    });
  });

  it("should write response files to the host", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createMockResponse({
        files: [
          { path: "src/Generated/Model.cs", content: "public class Model {}" },
          { path: "src/Generated/Client.cs", content: "public class Client {}" },
        ],
      }),
    );

    const ctx = createMockContext();
    await generate(ctx, '{"model":"test"}', '{"config":"test"}', defaultOptions);

    const writeFile = vi.mocked(ctx.program.host.writeFile);
    expect(writeFile).toHaveBeenCalledTimes(2);
    expect(writeFile).toHaveBeenCalledWith(
      "/output/src/Generated/Model.cs",
      "public class Model {}",
    );
    expect(writeFile).toHaveBeenCalledWith(
      "/output/src/Generated/Client.cs",
      "public class Client {}",
    );
  });

  it("should throw on non-OK response", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        createMockResponse({ error: "Generator failed" }, { ok: false, status: 500 }),
      );

    const ctx = createMockContext();
    await expect(
      generate(ctx, '{"model":"test"}', '{"config":"test"}', defaultOptions),
    ).rejects.toThrow("Playground server error (500)");
  });

  it("should handle empty files array in response", async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ files: [] }));

    const ctx = createMockContext();
    await generate(ctx, '{"model":"test"}', '{"config":"test"}', defaultOptions);

    const writeFile = vi.mocked(ctx.program.host.writeFile);
    expect(writeFile).not.toHaveBeenCalled();
  });
});

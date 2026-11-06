import { createTester, mockFile } from "@typespec/compiler/testing";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { parse } from "yaml";
import { $onEmit } from "../src/emitter.js";
import { $lib } from "../src/lib.js";
import { LIB_NAME } from "../src/options.js";

vi.mock("../src/utils.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/utils.js")>();
  return {
    ...actual,
    spawnAsync: vi.fn().mockResolvedValue({ stdout: "", stderr: 'openjdk version "17.0.11"' }),
  };
});

describe("emitter", () => {
  const tester = createTester(fileURLToPath(new URL("../..", import.meta.url)), {
    libraries: ["@typespec/http", "@azure-tools/typespec-client-generator-core"],
  })
    .importLibraries()
    .using("TypeSpec.Http")
    .files({
      [`node_modules/${LIB_NAME}/package.json`]: JSON.stringify({
        name: LIB_NAME,
        main: "index.js",
      }),
      [`node_modules/${LIB_NAME}/index.js`]: mockFile.js({ $lib, $onEmit }),
    })
    .emit(LIB_NAME, { "dev-options": { "generate-code-model": true } });

  it("writes the code model using the compiler host's filesystem", async () => {
    const runner = await tester.createInstance();
    const mkdirp = vi.spyOn(runner.fs.compilerHost, "mkdirp");
    const { outputs } = await runner.compile(`
      @service namespace Test {
        model Widget { name: string; }
        @route("/widgets") @get op read(): Widget;
      }
    `);

    expect(mkdirp).toHaveBeenCalled();
    const codeModel = parse(outputs["code-model.yaml"]);
    expect(
      codeModel.schemas.objects.find((schema: any) => schema.language.default.name === "Widget")
        .properties[0].serializedName,
    ).toBe("name");
  });
});

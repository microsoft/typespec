import { resolvePath } from "@typespec/compiler";
import { createTester, mockFile } from "@typespec/compiler/testing";
import { expect, type MockInstance, vi } from "vitest";
import { createAssetEmitter, TypeEmitter } from "../src/index.js";

const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: [],
});

export async function getHostForTypeSpecFile(contents: string, decorators?: Record<string, any>) {
  let tester = Tester;
  if (decorators) {
    tester = tester.files({ "dec.js": mockFile.js(decorators) });
    contents = `import "./dec.js";\n` + contents;
  }
  const [result] = await tester.compileAndDiagnose(contents, {
    compilerOptions: { outputDir: "tsp-output" },
  });
  return { program: result.program, compilerHost: result.fs.compilerHost };
}

export async function emitTypeSpec(
  Emitter: typeof TypeEmitter<any>,
  code: string,
  callCounts: Partial<Record<keyof TypeEmitter<any>, number>> = {},
  validateCallCounts = true,
) {
  const host = await getHostForTypeSpecFile(code);
  const emitter = createAssetEmitter(host.program, Emitter, {
    emitterOutputDir: "tsp-output",
    options: {},
  } as any);
  const spies = emitterSpies(Emitter);
  emitter.emitProgram();
  await emitter.writeOutput();
  if (validateCallCounts) {
    assertSpiesCalled(spies, callCounts);
  }
  return emitter;
}

type EmitterSpies = Record<string, MockInstance<any>>;
function emitterSpies(emitter: typeof TypeEmitter<any, any>) {
  const spies: EmitterSpies = {};
  const methods = Object.getOwnPropertyNames(emitter.prototype);
  for (const key of methods) {
    if (key === "constructor") continue;
    if ((emitter.prototype as any)[key].restore) {
      // assume this whole thing is already spied.
      return spies;
    }
    if (typeof (emitter.prototype as any)[key] !== "function") continue;
    spies[key] = vi.spyOn(emitter.prototype, key as any);
  }

  return spies;
}

function assertSpiesCalled(
  spies: EmitterSpies,
  callCounts: Partial<Record<keyof TypeEmitter<any>, number>>,
) {
  for (const [key, spy] of Object.entries(spies)) {
    const expectedCount = (callCounts as any)[key] ?? 1;
    expect(spy).toHaveBeenCalledTimes(expectedCount);
  }
}

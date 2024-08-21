import type { Program } from "../../src/core/program.js";
import type { EmitContext, Type } from "../../src/core/types.js";
import { createTestHost } from "../../src/testing/test-host.js";
import { createTestWrapper } from "../../src/testing/test-utils.js";

export async function createContextMock(program?: Program): Promise<EmitContext<any>> {
  if (!program) {
    const host = await createTestHost();
    const runner = createTestWrapper(host);
    await runner.compile("");
    program = runner.program;
  }

  return {
    program,
    emitterOutputDir: "",
    options: {},
    getAssetEmitter() {
      throw "Not implemented";
    },
  };
}

export async function getTypes<const T extends string>(
  code: string,
  names: T[]
): Promise<{ [k in T]: Type } & { context: EmitContext }> {
  const host = await createTestHost();
  const runner = createTestWrapper(host);
  await runner.compile(code);

  const obj: any = {
    context: await createContextMock(runner.program),
  };

  for (const name of names) {
    obj[name] = runner.program.resolveTypeReference(name)[0]!;
  }

  return obj;
}

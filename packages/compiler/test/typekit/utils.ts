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
  };
}

export async function getTypes<const T extends string>(
  code: string,
  names: T[],
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

export type GetAssignablesProps = {
  source?: string;
  target?: string;
  code?: string;
};
export async function getAssignables({ source, target, code }: GetAssignablesProps) {
  const host = await createTestHost();
  const runner = createTestWrapper(host);
  host.addJsFile("mock.js", {
    $decorators: {
      TestMock: {
        mock: () => null,
      },
    },
  });

  const testTypes = await runner.compile(`
    import "./mock.js";
    namespace TestMock;
    ${code ?? ""}
    extern dec mock(target: unknown, source: ${source ?? "unknown"}, destination: ${target ?? "unknown"});
  `);
  const decDeclaration = runner.program
    .getGlobalNamespaceType()
    .namespaces.get("TestMock")!
    .decoratorDeclarations.get("mock");
  const sourceProp = decDeclaration!.parameters[0].type!;
  const targetProp = decDeclaration!.parameters[1].type!;

  return { sourceProp, targetProp, program: runner.program, types: testTypes };
}

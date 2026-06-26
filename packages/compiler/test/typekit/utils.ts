import { createPerfReporter } from "../../src/core/perf.js";
import type { Program } from "../../src/core/program.js";
import type { EmitContext, Type } from "../../src/core/types.js";
import { mockFile } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

export async function createContextMock(program?: Program): Promise<EmitContext<any>> {
  if (!program) {
    const result = await Tester.compile("");
    program = result.program;
  }

  return {
    program,
    emitterOutputDir: "",
    options: {},
    perf: createPerfReporter(),
  };
}

export async function getTypes<const T extends string>(
  code: string,
  names: T[],
): Promise<{ [k in T]: Type } & { context: EmitContext }> {
  const { program } = await Tester.compile(code);

  const obj: any = {
    context: await createContextMock(program),
  };

  for (const name of names) {
    obj[name] = program.resolveTypeReference(name)[0]!;
  }

  return obj;
}

export type GetAssignablesProps = {
  source?: string;
  target?: string;
  code?: string;
};
export async function getAssignables({ source, target, code }: GetAssignablesProps) {
  const { program } = await Tester.files({
    "mock.js": mockFile.js({
      $decorators: {
        TestMock: {
          mock: () => null,
        },
      },
    }),
  }).compile(`
    import "./mock.js";
    namespace TestMock;
    ${code ?? ""}
    extern dec mock(target: unknown, source: ${source ?? "unknown"}, destination: ${target ?? "unknown"});
  `);

  const testMockNs = program.getGlobalNamespaceType().namespaces.get("TestMock")!;
  const decDeclaration = testMockNs.decoratorDeclarations.get("mock");
  const sourceProp = decDeclaration!.parameters[0].type!;
  const targetProp = decDeclaration!.parameters[1].type!;

  const types: Record<string, Type> = {};
  for (const [name, model] of testMockNs.models) types[name] = model;

  return { sourceProp, targetProp, program, types };
}

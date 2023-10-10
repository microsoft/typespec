import { DecoratorContext, EmitContext, Model, resolvePath } from "@typespec/compiler";

export async function $onEmit(context: EmitContext) {
  const outputDir = resolvePath(context.emitterOutputDir, "hello.txt");
  await context.program.host.writeFile(outputDir, "hello world!");
}

const groupKey = Symbol.for("my-library/group");
export function $group(context: DecoratorContext, target: Model, value: string) {
  context.program.stateMap(groupKey).set(target, value);
}

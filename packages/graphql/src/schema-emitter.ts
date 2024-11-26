import { emitFile, interpolatePath, type EmitContext } from "@typespec/compiler";
import type { ResolvedGraphQLEmitterOptions } from "./emitter.js";
import type { GraphQLEmitterOptions } from "./lib.js";

export function createGraphQLEmitter(
  context: EmitContext<GraphQLEmitterOptions>,
  options: ResolvedGraphQLEmitterOptions,
) {
  const program = context.program;

  return {
    emitGraphQL,
  };

  async function emitGraphQL() {
    // replace this with the real emitter code
    if (!program.compilerOptions.noEmit) {
      const filePath = interpolatePath(options.outputFile, { "schema-name": "schema" });
      await emitFile(program, {
        path: filePath,
        content: "",
        newLine: options.newLine,
      });
    }
  }
}

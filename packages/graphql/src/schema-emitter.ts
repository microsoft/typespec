import { emitFile, interpolatePath, type EmitContext } from "@typespec/compiler";
import { Output, SourceDirectory, SourceFile } from "@alloy-js/core/stc";
import type { ResolvedGraphQLEmitterOptions } from "./emitter.js";
import type { GraphQLEmitterOptions } from "./lib.js";
import { writeOutput } from "@typespec/emitter-framework";


export function createGraphQLEmitter(
  context: EmitContext<GraphQLEmitterOptions>,
  options: ResolvedGraphQLEmitterOptions,
) {
  const program = context.program;

  return {
    emitGraphQL,
  };

  async function emitGraphQL() {
  const content = `
type Bear {
  growl: String
}`;
    // replace this with the real emitter code

    if (!program.compilerOptions.noEmit) {
      const filePath = interpolatePath(options.outputFile, { "schema-name": "schema" });
      await emitFile(program, {
        path: filePath,
        content: content,
        newLine: options.newLine,
      });

    }
  }
}

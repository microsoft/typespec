import {
  emitFile,
  interpolatePath,
  navigateProgram,
  type EmitContext,
  type Model,
  type Namespace,
} from "@typespec/compiler";
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
    if (!program.compilerOptions.noEmit) {
      const filePath = interpolatePath(options.outputFile, { "schema-name": "schema" });
      navigateProgram(program, semanticNodeListener());
      await emitFile(program, {
        path: filePath,
        content: "query { hello: String }",
        newLine: options.newLine,
      });
    }
  }

  function semanticNodeListener() {
    // TODO: Add GraphQL types to registry as the TSP nodes are visited
    return {
      namespace: (namespace: Namespace) => {
        {}
      },
      model: (model: Model) => {
        {}
      },
    };
  }
}

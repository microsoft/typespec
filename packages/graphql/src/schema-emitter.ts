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
    // replace this with the real emitter code
    if (!program.compilerOptions.noEmit) {
      const filePath = interpolatePath(options.outputFile, { "schema-name": "schema" });
      navigateProgram(program, getSemanticNodeListener());
      await emitFile(program, {
        path: filePath,
        content: "query { hello: String }",
        newLine: options.newLine,
      });
    }
  }

  function getSemanticNodeListener() {
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

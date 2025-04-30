import {
  emitFile,
  interpolatePath,
  ListenerFlow,
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
    // TODO: Implement TSP to GraphQL type conversion logic
    return {
      namespace: (namespace: Namespace) => {
        console.log("namespace", namespace.name);
      },
      model: (model: Model) => {
        {}
      },
    };
  }
}

import type { EmitContext, NewLine } from "@typespec/compiler";
import { resolvePath } from "@typespec/compiler";
import type { GraphQLEmitterOptions } from "./lib.js";
import { createGraphQLEmitter } from "./schema-emitter.js";

const defaultOptions = {
  "new-line": "lf",
  "omit-unreachable-types": false,
  strict: false,
} as const;

export async function $onEmit(context: EmitContext<GraphQLEmitterOptions>) {
  const options = resolveOptions(context);
  const emitter = createGraphQLEmitter(context, options);
  await emitter.emitGraphQL();
}

export interface ResolvedGraphQLEmitterOptions {
  outputFile: string;
  newLine: NewLine;
  omitUnreachableTypes: boolean;
  strict: boolean;
}

export function resolveOptions(
  context: EmitContext<GraphQLEmitterOptions>,
): ResolvedGraphQLEmitterOptions {
  const resolvedOptions = { ...defaultOptions, ...context.options };
  const outputFile = resolvedOptions["output-file"] ?? "{schema-name}.graphql";

  return {
    outputFile: resolvePath(context.emitterOutputDir, outputFile),
    newLine: resolvedOptions["new-line"],
    omitUnreachableTypes: resolvedOptions["omit-unreachable-types"],
    strict: resolvedOptions["strict"],
  };
}

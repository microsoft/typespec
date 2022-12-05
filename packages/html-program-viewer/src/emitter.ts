import { EmitContext, emitFile, resolvePath } from "@cadl-lang/compiler";
import { renderProgram } from "./ui.js";

import { createCadlLibrary, JSONSchemaType } from "@cadl-lang/compiler";

export interface HtmlProgramViewerOptions {
  /**
   * Override compiler output-dir
   */
  "output-dir"?: string;
}

const EmitterOptionsSchema: JSONSchemaType<HtmlProgramViewerOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "output-dir": { type: "string", nullable: true },
  },
  required: [],
};

export const libDef = {
  name: "@cadl-lang/openapi3",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<HtmlProgramViewerOptions>,
  },
} as const;

export const $lib = createCadlLibrary(libDef);

export async function $onEmit(context: EmitContext<HtmlProgramViewerOptions>) {
  const html = renderProgram(context.program);
  const outputDir = context.emitterOutputDir;
  const htmlPath = resolvePath(outputDir, "cadl-program.html");
  await emitFile(context.program, {
    path: htmlPath,
    content: `<!DOCTYPE html><html lang="en"><link rel="stylesheet" href="style.css"><body>${html}</body></html>`,
  });
}

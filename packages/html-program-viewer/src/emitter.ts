import {
  createTypeSpecLibrary,
  emitFile,
  getDirectoryPath,
  resolvePath,
  type EmitContext,
  type JSONSchemaType,
} from "@typespec/compiler";
import { fileURLToPath } from "url";
import { renderProgram } from "./react/type-graph.js";

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
  name: "@typespec/openapi3",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<HtmlProgramViewerOptions>,
  },
} as const;

export const $lib = createTypeSpecLibrary(libDef);

export async function $onEmit(context: EmitContext<HtmlProgramViewerOptions>) {
  const html = renderProgram(context.program);
  const outputDir = context.emitterOutputDir;
  const htmlPath = resolvePath(outputDir, "typespec-program.html");
  await emitFile(context.program, {
    path: htmlPath,
    content: `<!DOCTYPE html><html lang="en"><link rel="stylesheet" href="style.css"><body>${html}</body></html>`,
  });
  const css = await context.program.host.readFile(
    resolvePath(getDirectoryPath(fileURLToPath(import.meta.url)), "style.css")
  );
  await emitFile(context.program, {
    path: resolvePath(outputDir, "style.css"),
    content: css.text,
  });
}

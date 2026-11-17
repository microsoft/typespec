import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import {
  createTypeSpecLibrary,
  emitFile,
  getDirectoryPath,
  resolvePath,
  type EmitContext,
  type JSONSchemaType,
  type Program,
} from "@typespec/compiler";
import { readFile } from "fs/promises";
import { createElement } from "react";
import ReactDOMServer from "react-dom/server";
import { fileURLToPath } from "url";
import { InspectType } from "./react/inspect-type/inspect-type.js";

/** Options accepted by the HTML program viewer emitter. */
export interface HtmlProgramViewerOptions {
  /**
   * This option is not used by the emitter. Configure the compiler's
   * `emitter-output-dir` option instead to choose where viewer files are written.
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

/**
 * Render the program's global namespace and its types as an HTML fragment.
 *
 * The result contains no document wrapper or stylesheet link and has no interactive
 * navigation. Use the React `TypeGraph` component from
 * `@typespec/html-program-viewer/react` for an interactive viewer.
 */
export function renderProgram(program: Program) {
  const html = ReactDOMServer.renderToString(
    createElement(FluentProvider, {
      theme: webLightTheme,
      children: createElement(InspectType, { entity: program.getGlobalNamespaceType() }),
    }), // [1
  );
  return html;
}

/** Library definition containing the emitter's identity and accepted options schema. */
export const libDef = {
  name: "@typespec/html-program-viewer",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<HtmlProgramViewerOptions>,
  },
} as const;

/** Compiler library instance created from {@link libDef} for emitter option validation. */
export const $lib = createTypeSpecLibrary(libDef);

/**
 * Emit `typespec-program.html` and its `style.css` into the compiler-provided
 * emitter output directory.
 */
export async function $onEmit(context: EmitContext<HtmlProgramViewerOptions>) {
  const html = renderProgram(context.program);
  const outputDir = context.emitterOutputDir;
  const htmlPath = resolvePath(outputDir, "typespec-program.html");
  await emitFile(context.program, {
    path: htmlPath,
    content: `<!DOCTYPE html><html lang="en"><link rel="stylesheet" href="style.css"><body>${html}</body></html>`,
  });

  const css = await readFile(
    resolvePath(getDirectoryPath(fileURLToPath(import.meta.url)), "style.css"),
  );
  await emitFile(context.program, {
    path: resolvePath(outputDir, "style.css"),
    content: css.toString(),
  });
}

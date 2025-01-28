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

export function renderProgram(program: Program) {
  const html = ReactDOMServer.renderToString(
    createElement(FluentProvider, {
      theme: webLightTheme,
      children: createElement(InspectType, { entity: program.getGlobalNamespaceType() }),
    }), // [1
  );
  return html;
}

export const libDef = {
  name: "@typespec/html-program-viewer",
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

  const css = await readFile(
    resolvePath(getDirectoryPath(fileURLToPath(import.meta.url)), "style.css"),
  );
  await emitFile(context.program, {
    path: resolvePath(outputDir, "style.css"),
    content: css.toString(),
  });
}

// -------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for
// license information.
// --------------------------------------------------------------------------

import { readFileSync } from "fs";
import Handlebars from "handlebars";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { EnumGroup } from "./render.js";

const templateDir = join(dirname(fileURLToPath(import.meta.url)), "templates");

function loadTemplate(name: string): Handlebars.TemplateDelegate {
  const source = readFileSync(join(templateDir, name), "utf-8");
  // noEscape: this renders Python source, not HTML.
  return Handlebars.compile(source, { noEscape: true });
}

let enumTemplate: Handlebars.TemplateDelegate | undefined;

export interface RenderEnumFileOptions {
  /** The license header block (already `# `-prefixed) or "" when none. */
  licenseHeader: string;
  /** Either `azure.core` (azure) or `corehttp.utils` (unbranded). */
  coreImport: string;
}

/** Render the full `_enums.py` file for a single namespace group. */
export function renderEnumFile(group: EnumGroup, options: RenderEnumFileOptions): string {
  if (!enumTemplate) {
    enumTemplate = loadTemplate("enum.py.hbs");
  }
  return enumTemplate({
    licenseHeader: options.licenseHeader,
    coreImport: options.coreImport,
    enums: group.enums,
  }).replace(/\r\n/g, "\n");
}

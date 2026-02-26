/* eslint-disable no-console */
import { readFile, realpath, stat } from "fs/promises";
import pc from "picocolors";
import { resolveModule } from "../../../../module-resolver/index.js";
import { loadJsFile } from "../../../source-loader.js";
import { CompilerHost, Diagnostic, NoTarget, TypeSpecLibrary } from "../../../types.js";

/**
 * Resolve an emitter package and return its library definition.
 */
async function resolveEmitterLibrary(
  host: CompilerHost,
  emitterName: string,
  baseDir: string,
): Promise<{ library: TypeSpecLibrary<any> | undefined; diagnostics: readonly Diagnostic[] }> {
  try {
    const module = await resolveModule(
      {
        realpath: (path) => realpath(path),
        stat: (path) => stat(path),
        readFile: async (path) => {
          const buffer = await readFile(path);
          return buffer.toString("utf-8");
        },
      },
      emitterName,
      { baseDir, conditions: ["import"] },
    );

    const entrypoint = module.type === "file" ? module.path : module.mainFile;
    const [file, jsDiagnostics] = await loadJsFile(host, entrypoint, NoTarget);
    if (!file) {
      return { library: undefined, diagnostics: jsDiagnostics };
    }

    const libDefinition: TypeSpecLibrary<any> | undefined = file.esmExports.$lib;
    return { library: libDefinition, diagnostics: jsDiagnostics };
  } catch (e: any) {
    return {
      library: undefined,
      diagnostics: [
        {
          code: "emitter-not-found",
          severity: "error",
          message: `Could not resolve emitter "${emitterName}". Make sure it is installed.\n  ${e.message}`,
          target: NoTarget,
        },
      ],
    };
  }
}

interface EmitterOptionVariant {
  type: string;
  allowedValues?: string[];
  default?: string;
  description?: string;
  nestedOptions?: EmitterOptionInfo[];
}

interface EmitterOptionInfo {
  name: string;
  type: string;
  allowedValues?: string[];
  default?: string;
  description?: string;
  nestedOptions?: EmitterOptionInfo[];
  /** When present, this option is a union of multiple variants */
  variants?: EmitterOptionVariant[];
}

/**
 * Extract option information from a JSON Schema properties object.
 * This is a pure function that can be tested independently.
 */
export function extractEmitterOptionsInfo(schema: any): EmitterOptionInfo[] {
  if (!schema || !schema.properties) {
    return [];
  }

  const options: EmitterOptionInfo[] = [];

  for (const [name, prop] of Object.entries<any>(schema.properties)) {
    options.push(extractOptionInfo(name, prop));
  }

  return options;
}

function extractOptionInfo(name: string, prop: any): EmitterOptionInfo {
  // Handle oneOf: extract variants, rendering object variants as nested
  if (prop.oneOf) {
    return extractOneOfOption(name, prop);
  }

  const info: EmitterOptionInfo = {
    name,
    type: resolveType(prop),
  };

  if (prop.enum) {
    info.allowedValues = prop.enum;
  }

  if (prop.default !== undefined) {
    info.default = JSON.stringify(prop.default);
  }

  if (prop.description) {
    info.description = Array.isArray(prop.description)
      ? prop.description.join("\n")
      : prop.description;
  }

  // Nested object properties
  if (prop.type === "object" && prop.properties) {
    info.nestedOptions = [];
    for (const [subName, subProp] of Object.entries<any>(prop.properties)) {
      info.nestedOptions.push(extractOptionInfo(subName, subProp));
    }
  }

  return info;
}

function extractOneOfOption(name: string, prop: any): EmitterOptionInfo {
  const rawVariants: any[] = prop.oneOf;

  const info: EmitterOptionInfo = {
    name,
    type: "",
    variants: [],
  };

  if (prop.description) {
    info.description = Array.isArray(prop.description)
      ? prop.description.join("\n")
      : prop.description;
  }

  if (prop.default !== undefined) {
    info.default = JSON.stringify(prop.default);
  }

  for (const variant of rawVariants) {
    const v: EmitterOptionVariant = {
      type: variant.type ?? "unknown",
    };

    if (variant.enum) {
      v.allowedValues = variant.enum;
    }

    if (variant.default !== undefined) {
      v.default = JSON.stringify(variant.default);
    }

    if (variant.description) {
      v.description = Array.isArray(variant.description)
        ? variant.description.join("\n")
        : variant.description;
    }

    if (variant.type === "object" && variant.properties) {
      v.nestedOptions = [];
      for (const [subName, subProp] of Object.entries<any>(variant.properties)) {
        v.nestedOptions.push(extractOptionInfo(subName, subProp));
      }
    }

    info.variants!.push(v);
  }

  return info;
}

function resolveType(prop: any): string {
  if (prop.oneOf) {
    return prop.oneOf.map((s: any) => resolveType(s)).join(" | ");
  }

  if (prop.type === "array") {
    if (prop.items) {
      const itemType = prop.items.type ?? "unknown";
      return `${itemType}[]`;
    }
    return "array";
  }

  if (prop.type === "object" && prop.properties) {
    const keys = Object.keys(prop.properties);
    return `object { ${keys.join(", ")} }`;
  }

  return prop.type ?? "unknown";
}

/**
 * Format emitter options as a colorized string for terminal display.
 * Returns lines of formatted output.
 */
export function formatEmitterOptions(emitterName: string, schema: any): string[] {
  const lines: string[] = [];
  const options = extractEmitterOptionsInfo(schema);

  lines.push(pc.bold(pc.cyan(emitterName)));
  lines.push("");

  if (options.length === 0) {
    lines.push(pc.gray("  This emitter does not define any options."));
    return lines;
  }

  for (const opt of options) {
    formatOption(lines, opt, 1);
  }

  return lines;
}

function formatOption(lines: string[], opt: EmitterOptionInfo, depth: number): void {
  const indent = "  ".repeat(depth);
  const descIndent = "  ".repeat(depth + 1);

  // Union with variants: render each variant separately
  if (opt.variants && opt.variants.length > 0) {
    lines.push(`${indent}${pc.bold(pc.cyan(opt.name))}:`);

    if (opt.description) {
      for (const descLine of opt.description.split("\n")) {
        lines.push(`${descIndent}${renderMarkdownLine(descLine)}`);
      }
    }

    for (const variant of opt.variants) {
      formatVariant(lines, variant, depth + 1);
    }

    lines.push("");
    return;
  }

  // Simple option: name: type/enum (default: value)
  const parts: string[] = [`${pc.bold(pc.cyan(opt.name))}:`];

  if (opt.allowedValues) {
    parts.push(opt.allowedValues.map((v: string) => pc.green(`"${v}"`)).join(" | "));
  } else if (opt.type) {
    parts.push(pc.yellow(opt.type));
  }

  if (opt.default !== undefined) {
    parts.push(pc.gray(`(default: ${colorizeDefault(opt.default, opt.type)})`));
  }

  lines.push(`${indent}${parts.join(" ")}`);

  if (opt.description) {
    for (const descLine of opt.description.split("\n")) {
      lines.push(`${descIndent}${renderMarkdownLine(descLine)}`);
    }
  }

  if (opt.nestedOptions && opt.nestedOptions.length > 0) {
    for (const sub of opt.nestedOptions) {
      formatOption(lines, sub, depth + 1);
    }
  }

  lines.push("");
}

function formatVariant(lines: string[], variant: EmitterOptionVariant, depth: number): void {
  const indent = "  ".repeat(depth);

  // Build variant header line
  const parts: string[] = [`${pc.gray("-")}`];
  if (variant.allowedValues) {
    parts.push(variant.allowedValues.map((v: string) => pc.green(`"${v}"`)).join(" | "));
  } else {
    parts.push(pc.yellow(variant.type));
  }

  if (variant.default !== undefined) {
    parts.push(pc.gray(`(default: ${colorizeDefault(variant.default, variant.type)})`));
  }

  lines.push(`${indent}${parts.join(" ")}`);

  if (variant.description) {
    for (const descLine of variant.description.split("\n")) {
      lines.push(`${indent}  ${renderMarkdownLine(descLine)}`);
    }
  }

  if (variant.nestedOptions && variant.nestedOptions.length > 0) {
    for (const sub of variant.nestedOptions) {
      formatOption(lines, sub, depth + 1);
    }
  }
}

function colorizeDefault(value: string, type: string): string {
  if (type.includes("string")) {
    return pc.green(value);
  }
  if (type.includes("boolean") || type.includes("number") || type.includes("int")) {
    return pc.yellow(value);
  }
  return pc.yellow(value);
}

/**
 * Render basic markdown inline formatting for terminal display.
 * Handles: `code`, **bold**, *italic*, and [links](url).
 * Plain text is rendered in gray, formatted tokens get their own colors.
 */
function renderMarkdownLine(line: string): string {
  // Tokenize: split into plain text and markdown tokens
  // Process in order: links, code, bold, italic
  const segments: { text: string; formatted: boolean }[] = [];
  let remaining = line;

  // Regex that matches any markdown token we handle
  const mdRegex = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;

  let lastIndex = 0;
  let match;
  while ((match = mdRegex.exec(remaining)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      segments.push({ text: remaining.slice(lastIndex, match.index), formatted: false });
    }

    if (match[1] !== undefined) {
      // Inline code: `code`
      segments.push({ text: pc.bold(pc.white(match[1])), formatted: true });
    } else if (match[2] !== undefined) {
      // Bold: **text**
      segments.push({ text: pc.bold(match[2]), formatted: true });
    } else if (match[3] !== undefined && match[4] !== undefined) {
      // Link: [text](url)
      segments.push({
        text: `${match[3]} ${pc.underline(pc.blue(match[4]))}`,
        formatted: true,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add trailing plain text
  if (lastIndex < remaining.length) {
    segments.push({ text: remaining.slice(lastIndex), formatted: false });
  }

  // If no markdown was found, just return gray
  if (segments.length === 0) {
    return pc.gray(line);
  }

  return segments.map((s) => (s.formatted ? s.text : pc.gray(s.text))).join("");
}

/**
 * Resolve an emitter and print its options.
 */
export async function printEmitterOptionsAction(
  host: CompilerHost,
  emitterName: string,
): Promise<readonly Diagnostic[]> {
  const cwd = process.cwd();
  const { library, diagnostics } = await resolveEmitterLibrary(host, emitterName, cwd);

  if (diagnostics.length > 0) {
    return diagnostics;
  }

  if (!library) {
    console.log(pc.yellow(`Could not load library definition for "${emitterName}".`));
    return [];
  }

  const schema = library.emitter?.options;
  const lines = formatEmitterOptions(emitterName, schema);
  for (const line of lines) {
    console.log(line);
  }

  return [];
}

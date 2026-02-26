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

interface EmitterOptionInfo {
  name: string;
  type: string;
  allowedValues?: string[];
  default?: string;
  description?: string;
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

    options.push(info);
  }

  return options;
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
    // Build inline header: name  type  allowed-values  (default: value)
    const parts: string[] = [pc.bold(pc.cyan(opt.name)), pc.yellow(opt.type)];

    if (opt.allowedValues) {
      parts.push(opt.allowedValues.map((v: string) => pc.green(`"${v}"`)).join(" | "));
    }

    if (opt.default !== undefined) {
      parts.push(pc.gray(`(default: ${pc.magenta(opt.default)})`));
    }

    lines.push(`  ${parts.join("  ")}`);

    if (opt.description) {
      const descLines = opt.description.split("\n");
      for (const descLine of descLines) {
        lines.push(`    ${pc.gray(descLine)}`);
      }
    }

    lines.push("");
  }

  return lines;
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

import { isAlias, isMap, isNode, isScalar, type Node, type YAMLMap } from "yaml";
import type { Diagnostic, DiagnosticResult, SourceFile, SourceLocation } from "../core/types.js";
import { parseYamlDocument } from "../yaml/parser.js";

/** A rule explicitly disabled in a configuration file's `linter.disable` mapping. */
export interface LinterDisable {
  /** Rule code as written, without resolving short names or library aliases. */
  readonly code: string;
  /** Decoded justification string. */
  readonly message: string;
  /** Range of the rule key in the supplied file. */
  readonly location: SourceLocation;
}

/**
 * Collect local `linter.disable` entries without loading or compiling a project.
 *
 * Reads only the relevant configuration structure; unrelated settings are not validated.
 * Does not follow `extends`, read rulesets, or interpret `enable: false`.
 * Same-file YAML aliases are supported, with locations at the original rule keys.
 *
 * @param source Configuration text or a source file retaining its path.
 * @returns Entries in source order and diagnostics. On error, the entries are `undefined`;
 * missing or empty optional sections produce an empty list.
 */
export function collectLinterDisables(
  source: string | SourceFile,
): DiagnosticResult<readonly LinterDisable[] | undefined> {
  const [{ file, doc }, parseDiagnostics] = parseYamlDocument(source);
  const diagnostics: Diagnostic[] = [...parseDiagnostics];
  if (diagnostics.some((d) => d.severity === "error")) {
    return [undefined, diagnostics];
  }

  const root = mapping(doc.contents, "/");
  const linter = mapping(root?.get("linter", true), "/linter");
  const disable = mapping(linter?.get("disable", true), "/linter/disable");
  const disables: LinterDisable[] = [];
  for (const pair of disable?.items ?? []) {
    const key = resolve(pair.key);
    const value = resolve(pair.value);
    if (key === undefined && isAlias(pair.key)) {
      continue;
    }
    if (!isScalar(key) || typeof key.value !== "string") {
      invalid(pair.key, "Rule codes must be strings.");
      continue;
    }
    if (!isScalar(value) || typeof value.value !== "string") {
      if (value !== undefined || !isAlias(pair.value)) {
        invalid(pair.value ?? pair.key, `Justification for "${key.value}" must be a string.`);
      }
      continue;
    }
    disables.push({ code: key.value, message: value.value, location: location(pair.key) });
  }
  return [diagnostics.some((d) => d.severity === "error") ? undefined : disables, diagnostics];

  function location(node: unknown): SourceLocation {
    return {
      file,
      pos: isNode(node) ? (node.range?.[0] ?? 0) : 0,
      end: isNode(node) ? (node.range?.[1] ?? 0) : 0,
    };
  }

  function invalid(node: unknown, message: string) {
    diagnostics.push({
      code: "invalid-schema",
      severity: "error",
      message,
      target: location(node),
    });
  }

  function resolve(node: unknown): Node | undefined {
    if (isAlias(node)) {
      const resolved = node.resolve(doc);
      if (resolved === undefined) {
        diagnostics.push({
          code: "yaml-alias-not-found",
          severity: "error",
          message: `Unresolved alias "${node.source}".`,
          target: location(node),
        });
      }
      return resolved;
    }
    return isNode(node) ? node : undefined;
  }

  function mapping(node: unknown, path: string): YAMLMap | undefined {
    const resolved = resolve(node);
    if (resolved === undefined || (isScalar(resolved) && resolved.value === null)) {
      return undefined;
    }
    if (isMap(resolved)) {
      return resolved;
    }
    invalid(node, `Expected a mapping at "${path}".`);
    return undefined;
  }
}

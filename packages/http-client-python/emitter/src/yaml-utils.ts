import jsyaml from "js-yaml";

/**
 * Serialize the given codemodel to a YAML string.
 *
 * The generated YAML is consumed by the Python generator, which parses it with
 * PyYAML (YAML 1.1). js-yaml, on the other hand, dumps using YAML 1.2 rules, so
 * plain scalars such as `2020_01_01` (a snake-cased enum member name) are left
 * unquoted because YAML 1.2 does not treat underscores as integer separators.
 * PyYAML would then read `2020_01_01` back as the integer `20200101`, corrupting
 * string values (e.g. enum member names, descriptions). Forcing every string
 * scalar to be quoted guarantees that PyYAML round-trips them as strings.
 *
 * This module must remain browser-safe (no Node built-ins): `emitter.ts` calls
 * this function on the browser/Pyodide path, and esbuild bundles it into the
 * playground bundle with `platform: "browser"`.
 * @param codemodel Codemodel to serialize
 * @return the YAML representation of the codemodel.
 */
export function dumpCodeModelToYaml(codemodel: unknown): string {
  return jsyaml.dump(codemodel, { forceQuotes: true, quotingType: '"' });
}

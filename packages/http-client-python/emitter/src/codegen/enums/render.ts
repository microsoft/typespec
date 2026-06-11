// -------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for
// license information.
// --------------------------------------------------------------------------

import {
  isAzureCoreModel,
  SdkEnumType,
  UsageFlags,
} from "@azure-tools/typespec-client-generator-core";
import { PythonSdkContext } from "../../lib.js";
import { camelToSnakeCase, getClientNamespace, md2Rst } from "../../utils.js";
import { enumClassName, enumValueName } from "./python-naming.js";
import { wrapString } from "./wrap-string.js";

// Mirrors `NAME_LENGTH_LIMIT` in generator/pygen/utils.py
const NAME_LENGTH_LIMIT = 40;

/**
 * Subset of `sdkScalarKindToPythonKind` (emitter/src/types.ts) needed to map an
 * enum value type to the Python primitive kind used by pygen.
 */
const SCALAR_KIND_TO_PYTHON_KIND: Record<string, string> = {
  numeric: "float",
  integer: "integer",
  safeint: "integer",
  int8: "integer",
  uint8: "integer",
  int16: "integer",
  uint16: "integer",
  int32: "integer",
  uint32: "integer",
  int64: "integer",
  uint64: "integer",
  float: "float",
  float32: "float",
  float64: "float",
  decimal: "decimal",
  decimal128: "decimal",
  string: "string",
  password: "string",
  guid: "string",
  url: "string",
  uri: "string",
  uuid: "string",
  etag: "string",
  armId: "string",
  ipAddress: "string",
  azureLocation: "string",
};

/** Python type annotation used as the enum class base for each supported kind. */
const PYTHON_KIND_TO_ANNOTATION: Record<string, string> = {
  string: "str",
  integer: "int",
  float: "float",
};

export class UnsupportedEnumError extends Error {}

export interface EnumValueView {
  /** The Python `NAME = declaration` line (without indentation). */
  assignment: string;
  /** The Python docstring including the surrounding triple quotes. */
  docstring: string;
}

export interface EnumView {
  /** Padded + capitalized Python class name. */
  name: string;
  /** The full `class ...:` signature (may span multiple lines for long names). */
  signature: string;
  /** The class docstring including the surrounding triple quotes. */
  docstring: string;
  values: EnumValueView[];
}

export interface EnumGroup {
  /** The client namespace whose `models/_enums.py` these enums belong to. */
  namespace: string;
  enums: EnumView[];
}

/**
 * Mirrors `update_description` in generator/pygen/preprocess/__init__.py:
 * default when empty, then ensure a trailing period. The original deliberately
 * does NOT strip trailing spaces (the `rstrip` result is discarded), so neither
 * do we.
 */
function updateDescription(description: string, defaultDescription: string): string {
  let result = description || defaultDescription;
  if (result && result[result.length - 1] !== ".") {
    result += ".";
  }
  return result;
}

function pythonKind(enumType: SdkEnumType): string {
  const kind = enumType.valueType.kind;
  return SCALAR_KIND_TO_PYTHON_KIND[kind] ?? kind;
}

function baseAnnotation(kind: string): string {
  const annotation = PYTHON_KIND_TO_ANNOTATION[kind];
  if (!annotation) {
    throw new UnsupportedEnumError(`Unsupported enum value type "${kind}" for TS rendering`);
  }
  return annotation;
}

/** Mirrors the various `get_declaration` implementations in primitive_types.py. */
function valueDeclaration(kind: string, value: unknown): string {
  if (kind === "string") {
    const str = String(value);
    return str === '"' ? `'${str}'` : `"${str}"`;
  }
  // integer / float -> Python str(value)
  return String(value);
}

function buildEnumValueView(value: SdkEnumType["values"][number], kind: string): EnumValueView {
  const name = enumValueName(camelToSnakeCase(value.name));
  const rawDescription = value.summary ? value.summary : (value.doc ?? "");
  const description = updateDescription(md2Rst(rawDescription) ?? "", name);
  return {
    assignment: `${name} = ${valueDeclaration(kind, value.value)}`,
    docstring: `"""${wrapString(description, "\n    ")}"""`,
  };
}

function buildEnumView(enumType: SdkEnumType): EnumView {
  const kind = pythonKind(enumType);
  const base = baseAnnotation(kind);
  const name = enumClassName(enumType.name);

  const rawDescription = enumType.summary
    ? enumType.summary
    : (enumType.doc ?? `Type of ${enumType.name}`);
  const description = updateDescription(md2Rst(rawDescription) ?? "", name);

  const pylintDisable = name.length > NAME_LENGTH_LIMIT ? "  # pylint: disable=name-too-long" : "";
  const signature = pylintDisable
    ? `class ${name}(${pylintDisable}\n    ${base}, Enum, metaclass=CaseInsensitiveEnumMeta\n):`
    : `class ${name}(${base}, Enum, metaclass=CaseInsensitiveEnumMeta):`;

  return {
    name,
    signature,
    // Matches enum.py.jinja2: the class docstring closes on its own line. black
    // collapses this to a single line when the content fits.
    docstring: `"""${wrapString(description, "\n    ")}\n    """`,
    values: enumType.values.map((value) => buildEnumValueView(value, kind)),
  };
}

/**
 * Whether an enum should be skipped, mirroring the filters applied in
 * `emitCodeModel` (emitter/src/code-model.ts).
 */
function shouldSkipEnum(enumType: SdkEnumType): boolean {
  if (enumType.isGeneratedName) {
    // Anonymous enums become `combined` types, not standalone enum classes.
    return true;
  }
  if (enumType.usage === UsageFlags.ApiVersionEnum) {
    return true;
  }
  if (onlyUsedByPolling(enumType.usage)) {
    return true;
  }
  if (isAzureCoreModel(enumType)) {
    return true;
  }
  return false;
}

// Mirrors `onlyUsedByPolling` in emitter/src/code-model.ts (not exported there).
function onlyUsedByPolling(usage: UsageFlags): boolean {
  return (
    ((usage & UsageFlags.LroInitial) > 0 ||
      (usage & UsageFlags.LroFinalEnvelope) > 0 ||
      (usage & UsageFlags.LroPolling) > 0) &&
    (usage & UsageFlags.Input) === 0 &&
    (usage & UsageFlags.Output) === 0
  );
}

/**
 * Collect renderable enums directly from TCGC, grouped by the client namespace
 * whose `models/_enums.py` file they belong to. Enums that use an unsupported
 * value type throw {@link UnsupportedEnumError} so callers can skip the file.
 */
export function collectEnumGroups(context: PythonSdkContext): EnumGroup[] {
  const groups = new Map<string, SdkEnumType[]>();
  for (const enumType of context.sdkPackage.enums) {
    if (shouldSkipEnum(enumType)) {
      continue;
    }
    const namespace = getClientNamespace(context, enumType.namespace);
    const existing = groups.get(namespace);
    if (existing) {
      existing.push(enumType);
    } else {
      groups.set(namespace, [enumType]);
    }
  }

  const result: EnumGroup[] = [];
  for (const [namespace, enums] of groups) {
    let views: EnumView[];
    try {
      views = enums.map(buildEnumView);
    } catch (error) {
      if (error instanceof UnsupportedEnumError) {
        // Leave this namespace's enum file to pygen; other namespaces are still
        // rendered from TypeScript.
        continue;
      }
      throw error;
    }
    // pygen renders `enums | sort`, i.e. sorted case-insensitively by class name.
    views.sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1));
    result.push({ namespace, enums: views });
  }
  return result;
}

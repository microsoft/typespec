import {
  getDoc,
  getNamespaceFullName,
  getTypeName,
  listOperationsIn,
  type Enum,
  type EnumMember,
  type Interface,
  type Model,
  type ModelProperty,
  type Namespace,
  type Operation,
  type Program,
  type Scalar,
  type Tuple,
  type Type,
  type Union,
  type UnionVariant,
} from "@typespec/compiler";
import pc from "picocolors";
import { inspect } from "util";
import type { ProgramSummary, SummaryItem } from "./summary.js";
import { getLocationInfo, normalizeValue } from "./type-view-json.js";

export function formatSummary(summary: ProgramSummary, pretty = true): string {
  const bold = pretty ? pc.bold : (value: string) => value;
  const dim = pretty ? pc.dim : (value: string) => value;
  const header = pretty ? pc.blue : (value: string) => value;
  const count = pretty ? pc.yellow : (value: string) => value;
  const lines: string[] = [];

  lines.push(`${bold(header("Services"))} (${count(String(summary.counts.services))})`);
  if (summary.services.length === 0) {
    lines.push(`- ${dim("(none)")}`);
  } else {
    for (const service of summary.services) {
      const displayName = service.title
        ? `${service.title} ${dim(`(${service.name})`)}`
        : service.name;
      lines.push(`- ${displayName} ${dim(`[${count(String(service.operations.length))} ops]`)}`);
    }
  }

  addGroup(lines, "Operations", summary.operations, dim, count, header);
  addGroup(lines, "Models", summary.types.models, dim, count, header);
  addGroup(lines, "Enums", summary.types.enums, dim, count, header);
  addGroup(lines, "Unions", summary.types.unions, dim, count, header);
  addGroup(lines, "Scalars", summary.types.scalars, dim, count, header);
  addGroup(lines, "Interfaces", summary.types.interfaces, dim, count, header);
  addGroup(lines, "Namespaces", summary.types.namespaces, dim, count, header);

  return lines.join("\n");
}

export function formatTypeView(program: Program, type: Type, pretty = true): string {
  const bold = pretty ? pc.bold : (value: string) => value;
  const dim = pretty ? pc.dim : (value: string) => value;
  const header = pretty ? pc.blue : (value: string) => value;
  const key = pretty ? pc.cyan : (value: string) => value;
  const count = pretty ? pc.yellow : (value: string) => value;
  const link = pretty ? pc.cyan : (value: string) => value;
  const lines: string[] = [];

  lines.push(`${bold(header("Type"))}: ${getTypeName(type)}`);
  addKeyValue(lines, "Kind", type.kind, key);

  if ("namespace" in type && type.namespace) {
    addKeyValue(lines, "Namespace", getNamespaceFullName(type.namespace), key);
  }

  const doc = getDoc(program, type);
  if (doc) {
    addKeyValue(lines, "Description", doc, key);
  }

  addKeyValue(lines, "Location", formatLocation(program, type, link, count), key);

  lines.push("");
  lines.push(`${bold(header("Details"))}`);
  lines.push(...formatTypeDetails(program, type, dim, key, count, pretty));

  lines.push("");
  lines.push(`${bold(header("Decorator State"))}`);
  lines.push(...formatState(program, type, dim, key, pretty));

  return lines.join("\n");
}

function addGroup(
  lines: string[],
  label: string,
  types: SummaryItem[],
  dim: (value: string) => string,
  count: (value: string) => string,
  titleColor: (value: string) => string,
) {
  lines.push(`${titleColor(label)} (${count(String(types.length))})`);
  if (types.length === 0) {
    lines.push(`- ${dim("(none)")}`);
    return;
  }
  for (const type of types) {
    lines.push(`- ${type.name}`);
  }
}

function formatTypeDetails(
  program: Program,
  type: Type,
  dim: (value: string) => string,
  key: (value: string) => string,
  count: (value: string) => string,
  pretty = true,
): string[] {
  switch (type.kind) {
    case "Namespace":
      return formatNamespaceDetails(type, key, count, dim);
    case "Model":
      return formatModelDetails(type, dim, key, count);
    case "ModelProperty":
      return formatModelPropertyDetails(type, dim, key, pretty);
    case "Interface":
      return formatInterfaceDetails(type, key, count, dim);
    case "Operation":
      return formatOperationDetails(type, dim, key);
    case "Enum":
      return formatEnumDetails(type, key, count, dim);
    case "Union":
      return formatUnionDetails(type, key, count, dim);
    case "Scalar":
      return formatScalarDetails(type, key, count, dim);
    case "Tuple":
      return formatTupleDetails(type, key, count);
    case "Boolean":
    case "Number":
    case "String":
      return [String(type.value)];
    case "Decorator":
      return formatDecoratorDetails(program, type, key);
    default:
      return [dim("(no specialized details available)")];
  }
}

function formatNamespaceDetails(
  type: Namespace,
  key: (value: string) => string,
  count: (value: string) => string,
  dim: (value: string) => string,
): string[] {
  const lines: string[] = [];
  addList(
    lines,
    "Namespaces",
    [...type.namespaces.values()].map((item) => item.name),
    key,
    count,
    dim,
  );
  addList(
    lines,
    "Models",
    [...type.models.values()].map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  addList(
    lines,
    "Scalars",
    [...type.scalars.values()].map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  addList(
    lines,
    "Interfaces",
    [...type.interfaces.values()].map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  addList(
    lines,
    "Operations",
    [...type.operations.values()].map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  addList(
    lines,
    "Unions",
    [...type.unions.values()].map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  addList(
    lines,
    "Enums",
    [...type.enums.values()].map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  return lines;
}

function formatModelDetails(
  type: Model,
  dim: (value: string) => string,
  key: (value: string) => string,
  count: (value: string) => string,
): string[] {
  const lines: string[] = [];
  addKeyValue(
    lines,
    "Base model",
    type.baseModel ? getTypeName(type.baseModel) : dim("(none)"),
    key,
  );
  addList(
    lines,
    "Derived models",
    type.derivedModels.map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );

  if (type.indexer) {
    addKeyValue(
      lines,
      "Indexer",
      `${getTypeName(type.indexer.key)} -> ${getTypeName(type.indexer.value)}`,
      key,
    );
  }

  if (type.properties.size === 0) {
    addKeyValue(lines, "Properties", dim("(none)"), key);
  } else {
    lines.push(`${key("Properties")}:`);
    for (const prop of type.properties.values()) {
      lines.push(`- ${formatModelProperty(prop)}`);
    }
  }

  return lines;
}

function formatModelPropertyDetails(
  type: ModelProperty,
  dim: (value: string) => string,
  key: (value: string) => string,
  pretty = true,
): string[] {
  const lines: string[] = [];
  addKeyValue(lines, "Type", getTypeName(type.type), key);
  addKeyValue(lines, "Optional", type.optional ? "yes" : "no", key);
  if (type.defaultValue !== undefined) {
    addKeyValue(lines, "Default value", formatValue(type.defaultValue, pretty), key);
  }
  if (type.sourceProperty) {
    addKeyValue(lines, "Source property", getTypeName(type.sourceProperty), key);
  }
  return lines.length === 0 ? [dim("(none)")] : lines;
}

function formatInterfaceDetails(
  type: Interface,
  key: (value: string) => string,
  count: (value: string) => string,
  dim: (value: string) => string,
): string[] {
  const lines: string[] = [];
  addList(
    lines,
    "Operations",
    listOperationsIn(type).map((op) => getTypeName(op)),
    key,
    count,
    dim,
  );
  addList(
    lines,
    "Source interfaces",
    type.sourceInterfaces.map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  return lines;
}

function formatOperationDetails(
  type: Operation,
  dim: (value: string) => string,
  key: (value: string) => string,
): string[] {
  const lines: string[] = [];
  if (type.interface) {
    addKeyValue(lines, "Interface", getTypeName(type.interface), key);
  }
  if (type.sourceOperation) {
    addKeyValue(lines, "Source operation", getTypeName(type.sourceOperation), key);
  }
  addKeyValue(lines, "Return type", getTypeName(type.returnType), key);

  if (type.parameters.properties.size === 0) {
    addKeyValue(lines, "Parameters", dim("(none)"), key);
  } else {
    lines.push(`${key("Parameters")}:`);
    for (const prop of type.parameters.properties.values()) {
      lines.push(`- ${formatModelProperty(prop)}`);
    }
  }

  return lines;
}

function formatEnumDetails(
  type: Enum,
  key: (value: string) => string,
  count: (value: string) => string,
  dim: (value: string) => string,
): string[] {
  const lines: string[] = [];
  if (type.members.size === 0) {
    addKeyValue(lines, "Members", dim("(none)"), key);
    return lines;
  }
  lines.push(`${key("Members")} (${count(String(type.members.size))}):`);
  for (const member of type.members.values()) {
    lines.push(`- ${formatEnumMember(member)}`);
  }
  return lines;
}

function formatUnionDetails(
  type: Union,
  key: (value: string) => string,
  count: (value: string) => string,
  dim: (value: string) => string,
): string[] {
  const lines: string[] = [];
  if (type.variants.size === 0) {
    addKeyValue(lines, "Variants", dim("(none)"), key);
    return lines;
  }
  lines.push(`${key("Variants")} (${count(String(type.variants.size))}):`);
  for (const variant of type.variants.values()) {
    lines.push(`- ${formatUnionVariant(variant)}`);
  }
  return lines;
}

function formatScalarDetails(
  type: Scalar,
  key: (value: string) => string,
  count: (value: string) => string,
  dim: (value: string) => string,
): string[] {
  const lines: string[] = [];
  if (type.baseScalar) {
    addKeyValue(lines, "Base scalar", getTypeName(type.baseScalar), key);
  }
  addList(
    lines,
    "Derived scalars",
    type.derivedScalars.map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  addList(
    lines,
    "Constructors",
    [...type.constructors.values()].map((item) => getTypeName(item)),
    key,
    count,
    dim,
  );
  return lines;
}

function formatTupleDetails(
  type: Tuple,
  key: (value: string) => string,
  count: (value: string) => string,
): string[] {
  return [
    `${key("Values")} (${count(String(type.values.length))}):`,
    ...type.values.map((value) => `- ${getTypeName(value)}`),
  ];
}

function formatDecoratorDetails(
  program: Program,
  type: Type,
  key: (value: string) => string,
): string[] {
  const target = type as any;
  const lines: string[] = [];
  if (target.target) {
    addKeyValue(lines, "Target", getTypeName(target.target), key);
  }
  if (target.parameters) {
    addKeyValue(
      lines,
      "Parameters",
      target.parameters.map((param: any) => getTypeName(param.type)).join(", "),
      key,
    );
  }
  const doc = getDoc(program, type);
  if (doc) {
    addKeyValue(lines, "Description", doc, key);
  }
  return lines.length === 0 ? ["(none)"] : lines;
}

function formatModelProperty(property: ModelProperty): string {
  const suffix = property.optional ? "?" : "";
  return `${property.name}${suffix}: ${getTypeName(property.type)}`;
}

function formatEnumMember(member: EnumMember): string {
  if (member.value === undefined) {
    return member.name.toString();
  }
  return `${member.name.toString()} = ${member.value}`;
}

function formatUnionVariant(variant: UnionVariant): string {
  const name = typeof variant.name === "symbol" ? variant.name.toString() : variant.name;
  return `${name}: ${getTypeName(variant.type)}`;
}

function addList(
  lines: string[],
  label: string,
  items: string[],
  key: (value: string) => string,
  count: (value: string) => string,
  dim: (value: string) => string,
) {
  if (items.length === 0) {
    addKeyValue(lines, label, dim("(none)"), key);
    return;
  }
  lines.push(`${key(label)} (${count(String(items.length))}):`);
  for (const item of items) {
    lines.push(`- ${item}`);
  }
}

function formatState(
  program: Program,
  type: Type,
  dim: (value: string) => string,
  key: (value: string) => string,
  pretty = true,
): string[] {
  const lines: string[] = [];
  const state = collectState(program, type);

  if (Object.keys(state.maps).length === 0 && state.sets.length === 0) {
    return [dim("(none)")];
  }

  if (Object.keys(state.maps).length > 0) {
    lines.push(`${key("State maps")}:`);
    for (const mapKey of Object.keys(state.maps)) {
      lines.push(`- ${mapKey}:`);
      lines.push(...indentLines(formatValue(state.maps[mapKey], pretty)));
    }
  }

  if (state.sets.length > 0) {
    lines.push(`${key("State sets")}:`);
    for (const setKey of state.sets) {
      lines.push(`- ${setKey}`);
    }
  }

  return lines;
}

function formatLocation(
  program: Program,
  type: Type,
  link: (value: string) => string,
  count: (value: string) => string,
): string {
  const info = getLocationInfo(program, type, process.cwd());
  if (info.synthetic) {
    return `${info.context} (synthetic)`;
  }
  return `${link(info.path)}:${count(String(info.line))}:${count(String(info.column))} (${info.context})`;
}

function collectState(program: Program, type: Type) {
  const mapEntries = [...(program as any).stateMaps.entries()]
    .map(([key, map]) => [key, map.get(type)] as const)
    .filter(([, value]) => value !== undefined);
  const setEntries = [...(program as any).stateSets.entries()].filter(([, set]) => set.has(type));

  const maps: Record<string, unknown> = {};
  for (const [key, value] of mapEntries) {
    maps[key.toString()] = normalizeValue(value);
  }
  const sets = setEntries.map(([key]) => key.toString()).sort((a, b) => a.localeCompare(b));

  return {
    maps,
    sets,
  };
}

function formatValue(value: unknown, pretty = true): string {
  return inspect(normalizeValue(value), {
    depth: 6,
    colors: pretty,
    compact: true,
    maxArrayLength: 100,
    breakLength: 120,
  });
}

function indentLines(value: string, indent = "  "): string[] {
  return value.split("\n").map((line) => `${indent}${line}`);
}

function addKeyValue(
  lines: string[],
  label: string,
  value: string,
  key: (value: string) => string,
) {
  lines.push(`${key(label)}: ${value}`);
}

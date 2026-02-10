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

type ColorFn = (value: string) => string;
const identity: ColorFn = (value: string) => value;

export class TypePrinter {
  readonly #bold: ColorFn;
  readonly #dim: ColorFn;
  readonly #header: ColorFn;
  readonly #key: ColorFn;
  readonly #count: ColorFn;
  readonly #link: ColorFn;
  readonly #pretty: boolean;

  constructor(pretty = true) {
    this.#pretty = pretty;
    this.#bold = pretty ? pc.bold : identity;
    this.#dim = pretty ? pc.dim : identity;
    this.#header = pretty ? pc.blue : identity;
    this.#key = pretty ? pc.cyan : identity;
    this.#count = pretty ? pc.yellow : identity;
    this.#link = pretty ? pc.cyan : identity;
  }

  formatSummary(summary: ProgramSummary): string {
    const lines: string[] = [];

    lines.push(
      `${this.#bold(this.#header("Services"))} (${this.#count(String(summary.counts.services))})`,
    );
    if (summary.services.length === 0) {
      lines.push(`- ${this.#dim("(none)")}`);
    } else {
      for (const service of summary.services) {
        const displayName = service.title
          ? `${service.title} ${this.#dim(`(${service.name})`)}`
          : service.name;
        lines.push(
          `- ${displayName} ${this.#dim(`[${this.#count(String(service.operations.length))} ops]`)}`,
        );
      }
    }

    this.#addGroup(lines, "Operations", summary.operations);
    this.#addGroup(lines, "Models", summary.types.models);
    this.#addGroup(lines, "Enums", summary.types.enums);
    this.#addGroup(lines, "Unions", summary.types.unions);
    this.#addGroup(lines, "Scalars", summary.types.scalars);
    this.#addGroup(lines, "Interfaces", summary.types.interfaces);
    this.#addGroup(lines, "Namespaces", summary.types.namespaces);

    return lines.join("\n");
  }

  formatTypeView(program: Program, type: Type): string {
    const lines: string[] = [];

    lines.push(`${this.#bold(this.#header("Type"))}: ${getTypeName(type)}`);
    this.#addKeyValue(lines, "Kind", type.kind);

    if ("namespace" in type && type.namespace) {
      this.#addKeyValue(lines, "Namespace", getNamespaceFullName(type.namespace));
    }

    const doc = getDoc(program, type);
    if (doc) {
      this.#addKeyValue(lines, "Description", doc);
    }

    this.#addKeyValue(lines, "Location", this.#formatLocation(program, type));

    lines.push("");
    lines.push(`${this.#bold(this.#header("Details"))}`);
    lines.push(...this.#formatTypeDetails(program, type));

    lines.push("");
    lines.push(`${this.#bold(this.#header("Decorator State"))}`);
    lines.push(...this.#formatState(program, type));

    return lines.join("\n");
  }

  #addGroup(lines: string[], label: string, types: SummaryItem[]): void {
    lines.push(`${this.#header(label)} (${this.#count(String(types.length))})`);
    if (types.length === 0) {
      lines.push(`- ${this.#dim("(none)")}`);
      return;
    }
    for (const type of types) {
      lines.push(`- ${type.name}`);
    }
  }

  #formatTypeDetails(program: Program, type: Type): string[] {
    switch (type.kind) {
      case "Namespace":
        return this.#formatNamespaceDetails(type);
      case "Model":
        return this.#formatModelDetails(type);
      case "ModelProperty":
        return this.#formatModelPropertyDetails(type);
      case "Interface":
        return this.#formatInterfaceDetails(type);
      case "Operation":
        return this.#formatOperationDetails(type);
      case "Enum":
        return this.#formatEnumDetails(type);
      case "Union":
        return this.#formatUnionDetails(type);
      case "Scalar":
        return this.#formatScalarDetails(type);
      case "Tuple":
        return this.#formatTupleDetails(type);
      case "Boolean":
      case "Number":
      case "String":
        return [String(type.value)];
      case "Decorator":
        return this.#formatDecoratorDetails(program, type);
      default:
        return [this.#dim("(no specialized details available)")];
    }
  }

  #formatNamespaceDetails(type: Namespace): string[] {
    const lines: string[] = [];
    this.#addList(
      lines,
      "Namespaces",
      [...type.namespaces.values()].map((item) => item.name),
    );
    this.#addList(
      lines,
      "Models",
      [...type.models.values()].map((item) => getTypeName(item)),
    );
    this.#addList(
      lines,
      "Scalars",
      [...type.scalars.values()].map((item) => getTypeName(item)),
    );
    this.#addList(
      lines,
      "Interfaces",
      [...type.interfaces.values()].map((item) => getTypeName(item)),
    );
    this.#addList(
      lines,
      "Operations",
      [...type.operations.values()].map((item) => getTypeName(item)),
    );
    this.#addList(
      lines,
      "Unions",
      [...type.unions.values()].map((item) => getTypeName(item)),
    );
    this.#addList(
      lines,
      "Enums",
      [...type.enums.values()].map((item) => getTypeName(item)),
    );
    return lines;
  }

  #formatModelDetails(type: Model): string[] {
    const lines: string[] = [];
    this.#addKeyValue(
      lines,
      "Base model",
      type.baseModel ? getTypeName(type.baseModel) : this.#dim("(none)"),
    );
    this.#addList(
      lines,
      "Derived models",
      type.derivedModels.map((item) => getTypeName(item)),
    );

    if (type.indexer) {
      this.#addKeyValue(
        lines,
        "Indexer",
        `${getTypeName(type.indexer.key)} -> ${getTypeName(type.indexer.value)}`,
      );
    }

    if (type.properties.size === 0) {
      this.#addKeyValue(lines, "Properties", this.#dim("(none)"));
    } else {
      lines.push(`${this.#key("Properties")}:`);
      for (const prop of type.properties.values()) {
        lines.push(`- ${formatModelProperty(prop)}`);
      }
    }

    return lines;
  }

  #formatModelPropertyDetails(type: ModelProperty): string[] {
    const lines: string[] = [];
    this.#addKeyValue(lines, "Type", getTypeName(type.type));
    this.#addKeyValue(lines, "Optional", type.optional ? "yes" : "no");
    if (type.defaultValue !== undefined) {
      this.#addKeyValue(lines, "Default value", this.#formatValue(type.defaultValue));
    }
    if (type.sourceProperty) {
      this.#addKeyValue(lines, "Source property", getTypeName(type.sourceProperty));
    }
    return lines.length === 0 ? [this.#dim("(none)")] : lines;
  }

  #formatInterfaceDetails(type: Interface): string[] {
    const lines: string[] = [];
    this.#addList(
      lines,
      "Operations",
      listOperationsIn(type).map((op) => getTypeName(op)),
    );
    this.#addList(
      lines,
      "Source interfaces",
      type.sourceInterfaces.map((item) => getTypeName(item)),
    );
    return lines;
  }

  #formatOperationDetails(type: Operation): string[] {
    const lines: string[] = [];
    if (type.interface) {
      this.#addKeyValue(lines, "Interface", getTypeName(type.interface));
    }
    if (type.sourceOperation) {
      this.#addKeyValue(lines, "Source operation", getTypeName(type.sourceOperation));
    }
    this.#addKeyValue(lines, "Return type", getTypeName(type.returnType));

    if (type.parameters.properties.size === 0) {
      this.#addKeyValue(lines, "Parameters", this.#dim("(none)"));
    } else {
      lines.push(`${this.#key("Parameters")}:`);
      for (const prop of type.parameters.properties.values()) {
        lines.push(`- ${formatModelProperty(prop)}`);
      }
    }

    return lines;
  }

  #formatEnumDetails(type: Enum): string[] {
    const lines: string[] = [];
    if (type.members.size === 0) {
      this.#addKeyValue(lines, "Members", this.#dim("(none)"));
      return lines;
    }
    lines.push(`${this.#key("Members")} (${this.#count(String(type.members.size))}):`);
    for (const member of type.members.values()) {
      lines.push(`- ${formatEnumMember(member)}`);
    }
    return lines;
  }

  #formatUnionDetails(type: Union): string[] {
    const lines: string[] = [];
    if (type.variants.size === 0) {
      this.#addKeyValue(lines, "Variants", this.#dim("(none)"));
      return lines;
    }
    lines.push(`${this.#key("Variants")} (${this.#count(String(type.variants.size))}):`);
    for (const variant of type.variants.values()) {
      lines.push(`- ${formatUnionVariant(variant)}`);
    }
    return lines;
  }

  #formatScalarDetails(type: Scalar): string[] {
    const lines: string[] = [];
    if (type.baseScalar) {
      this.#addKeyValue(lines, "Base scalar", getTypeName(type.baseScalar));
    }
    this.#addList(
      lines,
      "Derived scalars",
      type.derivedScalars.map((item) => getTypeName(item)),
    );
    this.#addList(
      lines,
      "Constructors",
      [...type.constructors.values()].map((item) => getTypeName(item)),
    );
    return lines;
  }

  #formatTupleDetails(type: Tuple): string[] {
    return [
      `${this.#key("Values")} (${this.#count(String(type.values.length))}):`,
      ...type.values.map((value) => `- ${getTypeName(value)}`),
    ];
  }

  #formatDecoratorDetails(program: Program, type: Type): string[] {
    const target = type as any;
    const lines: string[] = [];
    if (target.target) {
      this.#addKeyValue(lines, "Target", getTypeName(target.target));
    }
    if (target.parameters) {
      this.#addKeyValue(
        lines,
        "Parameters",
        target.parameters.map((param: any) => getTypeName(param.type)).join(", "),
      );
    }
    const doc = getDoc(program, type);
    if (doc) {
      this.#addKeyValue(lines, "Description", doc);
    }
    return lines.length === 0 ? ["(none)"] : lines;
  }

  #addList(lines: string[], label: string, items: string[]): void {
    if (items.length === 0) {
      this.#addKeyValue(lines, label, this.#dim("(none)"));
      return;
    }
    lines.push(`${this.#key(label)} (${this.#count(String(items.length))}):`);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
  }

  #formatState(program: Program, type: Type): string[] {
    const lines: string[] = [];
    const state = collectState(program, type);

    if (Object.keys(state.maps).length === 0 && state.sets.length === 0) {
      return [this.#dim("(none)")];
    }

    if (Object.keys(state.maps).length > 0) {
      lines.push(`${this.#key("State maps")}:`);
      for (const mapKey of Object.keys(state.maps)) {
        lines.push(`- ${mapKey}:`);
        lines.push(...indentLines(this.#formatValue(state.maps[mapKey])));
      }
    }

    if (state.sets.length > 0) {
      lines.push(`${this.#key("State sets")}:`);
      for (const setKey of state.sets) {
        lines.push(`- ${setKey}`);
      }
    }

    return lines;
  }

  #formatLocation(program: Program, type: Type): string {
    const info = getLocationInfo(program, type, process.cwd());
    if (info.synthetic) {
      return `${info.context} (synthetic)`;
    }
    return `${this.#link(info.path)}:${this.#count(String(info.line))}:${this.#count(String(info.column))} (${info.context})`;
  }

  #formatValue(value: unknown): string {
    return inspect(normalizeValue(value), {
      depth: 6,
      colors: this.#pretty,
      compact: true,
      maxArrayLength: 100,
      breakLength: 120,
    });
  }

  #addKeyValue(lines: string[], label: string, value: string): void {
    lines.push(`${this.#key(label)}: ${value}`);
  }
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

function indentLines(value: string, indent = "  "): string[] {
  return value.split("\n").map((line) => `${indent}${line}`);
}

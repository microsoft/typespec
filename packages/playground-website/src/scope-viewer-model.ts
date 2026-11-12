import {
  getLocationContext,
  getNamespaceFullName,
  getTypeName,
  walkPropertiesInherited,
  type EnumMember,
  type Namespace,
  type Program,
  type Type,
} from "@typespec/compiler";
import type { ScopeView } from "@typespec/compiler/experimental";

export function getScopeAxes(views: readonly ScopeView[]) {
  const axes = new Map<string, { name: string; label: string; members: EnumMember[] }>();
  for (const view of views) {
    for (const member of view.selections) {
      const name = getTypeName(member.enum);
      let axis = axes.get(name);
      if (!axis) {
        axis = { name, label: member.enum.name, members: [] };
        axes.set(name, axis);
      }
      if (!axis.members.some((x) => x.name === member.name)) axis.members.push(member);
    }
  }
  return [...axes.values()];
}

export function selectScopeView(
  views: readonly ScopeView[],
  current: ScopeView | undefined,
  axis: string,
  member: string,
): ScopeView | undefined {
  const candidates = views.filter((view) =>
    view.selections.some((s) => getTypeName(s.enum) === axis && s.name === member),
  );
  const score = (view: ScopeView) =>
    view.selections.filter((s) =>
      current?.selections.some(
        (previous) =>
          getTypeName(previous.enum) === getTypeName(s.enum) && previous.name === s.name,
      ),
    ).length;
  return candidates.reduce<ScopeView | undefined>(
    (best, view) => (!best || score(view) > score(best) ? view : best),
    undefined,
  );
}

export function getScopeDeclarations(program: Program): Type[] {
  const result: Type[] = [];
  const visit = (namespace: Namespace) => {
    for (const collection of [
      namespace.models,
      namespace.scalars,
      namespace.enums,
      namespace.unions,
      namespace.interfaces,
      namespace.operations,
    ]) {
      for (const type of collection.values()) {
        if (getLocationContext(program, type).type === "project") result.push(type);
      }
    }
    for (const child of namespace.namespaces.values()) visit(child);
  };
  visit(program.getGlobalNamespaceType());
  return result;
}

export function getScopeGraphPath(type: Type | undefined): string {
  if (!type || !("namespace" in type) || !("name" in type)) return "$";
  const collections = {
    Model: "models",
    Scalar: "scalars",
    Enum: "enums",
    Union: "unions",
    Interface: "interfaces",
    Operation: "operations",
  } as const;
  if (!(type.kind in collections)) return "$";
  const namespace = type.namespace ? getNamespaceFullName(type.namespace) : "";
  return `$.${namespace || "(global)"}.${collections[type.kind as keyof typeof collections]}.${type.name}`;
}

function resolvedType(type: Type, seen = new Set<Type>()): string {
  if (type.kind !== "Union" || seen.has(type)) return getTypeName(type);
  const next = new Set([...seen, type]);
  return [...type.variants.values()].map((v) => resolvedType(v.type, next)).join(" | ") || "never";
}

function members(type: Type | undefined): Map<string, string> {
  switch (type?.kind) {
    case "Model":
      return new Map(
        [...walkPropertiesInherited(type)].map((p) => [
          p.name,
          `${p.name}${p.optional ? "?" : ""}: ${resolvedType(p.type)}`,
        ]),
      );
    case "Interface":
      return new Map([...type.operations.values()].map((op) => [op.name, renderScopeType(op)]));
    case "Union":
      return new Map(
        [...type.variants.values()].map((v, i) => [
          typeof v.name === "string" ? v.name : `variant ${i + 1}`,
          resolvedType(v.type),
        ]),
      );
    case "Enum":
      return new Map(
        [...type.members.values()].map((m) => [
          m.name,
          m.value === undefined ? m.name : `${m.name}: ${JSON.stringify(m.value)}`,
        ]),
      );
    default:
      return new Map();
  }
}

export function getScopeMemberChanges(base: Type, selected: Type | undefined) {
  const before = members(base);
  const after = members(selected);
  return [...new Set([...before.keys(), ...after.keys()])].map((name) => ({
    name,
    before: before.get(name),
    after: after.get(name),
    status: !after.has(name)
      ? "removed"
      : !before.has(name)
        ? "added"
        : before.get(name) !== after.get(name)
          ? "changed"
          : "unchanged",
  }));
}

export function renderScopeType(type: Type | undefined): string {
  if (!type) return "// Declaration is not present in this scope.";
  const templateParameters =
    type.node && "templateParameters" in type.node
      ? type.node.templateParameters.map((p) => p.id.sv)
      : [];
  const name =
    ("name" in type ? String(type.name) : getTypeName(type)) +
    (templateParameters.length ? `<${templateParameters.join(", ")}>` : "");
  const body = (lines: string[]) => `{\n${lines.map((l) => `  ${l}`).join("\n")}\n}`;
  switch (type.kind) {
    case "Model":
      return `model ${name} ${body([...members(type).values()].map((p) => `${p};`))}`;
    case "Union":
      return `union ${name} ${body(
        [...type.variants.values()].map(
          (v) => `${typeof v.name === "string" ? `${v.name}: ` : ""}${resolvedType(v.type)},`,
        ),
      )}`;
    case "Enum":
      return `enum ${name} ${body([...members(type).values()].map((m) => `${m},`))}`;
    case "Scalar":
      return `scalar ${name}${type.baseScalar ? ` extends ${getTypeName(type.baseScalar)}` : ""};`;
    case "Operation":
      return `op ${name}(${[...members(type.parameters).values()].join(", ")}): ${resolvedType(type.returnType)};`;
    case "Interface":
      return `interface ${name} ${body([...type.operations.values()].map(renderScopeType))}`;
    default:
      return getTypeName(type);
  }
}

import { BranchRegular } from "@fluentui/react-icons";
import {
  getAutoDecoratorValue,
  getTypeName,
  type Namespace,
  type Program,
  type Type,
} from "@typespec/compiler";
import { getScopeViews, type ScopeView } from "@typespec/compiler/experimental";
import { TypeGraph } from "@typespec/html-program-viewer/react";
import type { OutputViewerProps, ProgramViewer } from "@typespec/playground/react";
import { useMemo, useState } from "react";

function ScopeViewer({ program }: OutputViewerProps) {
  const views = getScopeViews(program);
  const [selected, setSelected] = useState("base");
  const view = views.find((v) => v.name === selected);
  const visibleProgram = useMemo(() => view?.getProgram() ?? program, [program, view]);
  const metadata = useMemo(() => collectMetadata(program, view), [program, view]);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "auto" }}>
      <div style={{ padding: 12 }}>
        <p>
          {views.length} concrete views checked during compilation, before selecting a view. Base
          retains all types, versions and visibilities, but excludes conditioned metadata.
        </p>
        <label>
          Scope view{" "}
          <select
            aria-label="Scope view"
            value={view?.name ?? "base"}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="base">Base (all types, unscoped metadata only)</option>
            {views.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <details open>
          <summary>Resolved readonly metadata</summary>
          <pre aria-label="Resolved readonly metadata">{JSON.stringify(metadata, null, 2)}</pre>
        </details>
      </div>
      <div style={{ flex: 1, minHeight: 350 }}>
        <TypeGraph program={visibleProgram} />
      </div>
    </div>
  );
}

function collectMetadata(program: Program, view: ScopeView | undefined) {
  const decorators = new Set<string>();
  const stateMaps = (program as Program & { stateMaps: Map<symbol, Map<Type, unknown>> }).stateMaps;
  for (const key of stateMaps.keys()) {
    if (key.description?.startsWith("dec:")) decorators.add(key.description.slice(4));
    if (key.description?.startsWith("dec-scoped:")) decorators.add(key.description.slice(11));
  }
  const output: Record<string, unknown> = {};
  const add = (type: Type) => {
    for (const decorator of decorators) {
      const value = view
        ? view.getAutoDecoratorValue(decorator, type)
        : getAutoDecoratorValue(program, decorator, type);
      if (value !== undefined) output[`${getTypeName(type)} @${decorator}`] = formatValue(value);
    }
  };
  const visit = (namespace: Namespace) => {
    if (namespace.name === "TypeSpec") return;
    for (const collection of [
      namespace.models,
      namespace.scalars,
      namespace.enums,
      namespace.unions,
      namespace.interfaces,
      namespace.operations,
    ]) {
      for (const type of collection.values()) {
        add(type);
        if (type.kind === "Model") for (const property of type.properties.values()) add(property);
      }
    }
    for (const child of namespace.namespaces.values()) visit(child);
  };
  visit(view?.getGlobalNamespaceType() ?? program.getGlobalNamespaceType());
  return output;
}

function formatValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if ("entityKind" in value && value.entityKind === "Type") return getTypeName(value as Type);
  if (Array.isArray(value)) return value.map(formatValue);
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, formatValue(child)]));
}

export const ScopeViewsViewer: ProgramViewer = {
  key: "scope-views",
  label: "Scope views",
  icon: <BranchRegular />,
  render: ScopeViewer,
};

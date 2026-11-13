import { Tab, TabList } from "@fluentui/react-components";
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
import { useMemo } from "react";
import {
  getDeclarationLabel,
  getScopeAxes,
  getScopeDeclarations,
  getScopeGraphPath,
  getScopeMemberChanges,
  renderScopeType,
  selectScopeView,
} from "./scope-viewer-model.js";
import style from "./scope-viewer.module.css";

function ScopeViewer({
  program,
  viewerState = {},
  onViewerStateChange,
  onRevealSource,
}: OutputViewerProps) {
  const views = getScopeViews(program);
  const axes = useMemo(() => getScopeAxes(views), [views]);
  const selectedView = views.find((v) => v.name === viewerState.scopeView) ?? views[0];
  const view = viewerState.scopeMode === "base" ? undefined : selectedView;
  const declarations = useMemo(() => getScopeDeclarations(program), [program]);
  const declaration =
    declarations.find((t) => getDeclarationLabel(t) === viewerState.scopeType) ??
    declarations.find((t) => t.kind === "Model" && t.name === "Widget") ??
    declarations.find((t) => t.kind === "Model") ??
    declarations[0];
  const projected =
    declaration && (!view || view.isPresent(declaration))
      ? (view?.getType(declaration) ?? declaration)
      : undefined;
  const changes = declaration ? getScopeMemberChanges(declaration, projected) : [];
  const tab = viewerState.scopeTab ?? "shape";
  const graphContext = `${view?.name ?? "base"}:${declaration ? getDeclarationLabel(declaration) : ""}`;
  const graphPath =
    viewerState.scopeGraphContext === graphContext
      ? viewerState.scopeGraphPath
      : getScopeGraphPath(projected);
  const visibleProgram = useMemo(() => view?.getProgram() ?? program, [program, view]);
  const metadata = useMemo(() => collectMetadata(program, view), [program, view]);
  const update = (state: Record<string, string>) =>
    onViewerStateChange?.({ ...viewerState, ...state });
  const selectAxis = (axis: string, member: string) => {
    const next = selectScopeView(views, selectedView, axis, member);
    if (!next) return;
    const linked = next.selections.filter(
      (s) =>
        getTypeName(s.enum) !== axis &&
        selectedView?.selections.some(
          (previous) =>
            getTypeName(previous.enum) === getTypeName(s.enum) && previous.name !== s.name,
        ),
    );
    update({
      scopeView: next.name,
      scopeMode: "scoped",
      scopeNotice: linked.length
        ? `Linked selections adjusted: ${linked.map((s) => getTypeName(s)).join(", ")}.`
        : "",
    });
  };
  return (
    <div className={style.root}>
      <div className={style.controls}>
        <h2>Scope explorer</h2>
        <p className={style.hint}>
          {views.length} concrete views checked during compilation. Selecting a scope only reads an
          already checked graph.
        </p>
        <div className={style.axes}>
          <label>
            Graph
            <select
              aria-label="Graph view"
              value={view ? "scoped" : "base"}
              onChange={(e) => update({ scopeMode: e.target.value, scopeNotice: "" })}
            >
              <option value="scoped" disabled={!selectedView}>
                Selected scope
              </option>
              <option value="base">Base graph</option>
            </select>
          </label>
          {axes.map((axis) => (
            <label key={axis.name} title={axis.name}>
              {axis.label}
              <select
                aria-label={`Scope: ${axis.name}`}
                value={
                  selectedView?.selections.find((s) => getTypeName(s.enum) === axis.name)?.name
                }
                onChange={(e) => selectAxis(axis.name, e.target.value)}
              >
                {axis.members.map((member) => (
                  <option key={member.name} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p className={style.hint}>
          {view?.name ?? "Base: all declarations and visibilities; no conditioned metadata."}
        </p>
        <div role="status">{viewerState.scopeNotice}</div>
        <label className={style.declaration}>
          Declaration
          <select
            aria-label="Declaration"
            value={declaration ? getDeclarationLabel(declaration) : ""}
            onChange={(e) => update({ scopeType: e.target.value })}
          >
            {declarations.map((type) => (
              <option key={getDeclarationLabel(type)} value={getDeclarationLabel(type)}>
                {getDeclarationLabel(type)}
                {view && !view.isPresent(type) ? " (not present)" : ""}
              </option>
            ))}
          </select>
        </label>
        <TabList
          aria-label="Scope explorer views"
          selectedValue={tab}
          onTabSelect={(_, data) => update({ scopeTab: String(data.value) })}
        >
          <Tab value="shape">Shape comparison</Tab>
          <Tab value="graph">Type graph</Tab>
          <Tab value="metadata">Readonly metadata</Tab>
        </TabList>
      </div>
      {tab === "shape" && (
        <div className={style.content}>
          <p className={style.hint}>
            Shape preview, not emitted output. Inherited properties and union-valued members are
            expanded to make changes visible.
          </p>
          <div className={style.comparison}>
            <section>
              <h3>Base</h3>
              <pre aria-label="Base type shape">{renderScopeType(declaration)}</pre>
            </section>
            <section>
              <h3>{view ? "Selected scope" : "Base (no scope selected)"}</h3>
              <pre aria-label="Selected type shape">{renderScopeType(projected)}</pre>
            </section>
          </div>
          {changes.length > 0 && (
            <table className={style.changes} aria-label="Member changes">
              <thead>
                <tr>
                  <th>Change</th>
                  <th>Base</th>
                  <th>Selected</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => (
                  <tr key={change.name} data-change={change.status}>
                    <td>{change.status}</td>
                    <td>
                      <code>{change.before ?? "-"}</code>
                    </td>
                    <td>
                      <code>{change.after ?? "-"}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === "graph" && (
        <div className={style.graph}>
          {!projected && (
            <p className={style.hint}>This declaration is not present in this scope.</p>
          )}
          <TypeGraph
            program={visibleProgram}
            currentPath={graphPath}
            onNavigationChange={(path) =>
              update({ scopeGraphPath: path, scopeGraphContext: graphContext })
            }
            onRevealSource={onRevealSource}
          />
        </div>
      )}
      {tab === "metadata" && (
        <div className={style.content}>
          <p className={style.hint}>
            Readonly metadata for all present declarations. Choose Base graph to verify conditioned
            values are unavailable by default.
          </p>
          <pre aria-label="Resolved readonly metadata">{JSON.stringify(metadata, null, 2)}</pre>
        </div>
      )}
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

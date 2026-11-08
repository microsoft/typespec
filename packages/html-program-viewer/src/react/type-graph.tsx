import { Button, FluentProvider, webLightTheme } from "@fluentui/react-components";
import { EyeOffRegular } from "@fluentui/react-icons";
import type { Program } from "@typespec/compiler";
import { Pane, SplitPane } from "@typespec/react-components";
import { type FunctionComponent } from "react";
import ReactDOMServer from "react-dom/server";
import { CurrentPath } from "./current-path/current-path.js";
import { ListTypeView } from "./list-type-view/list-type-view.js";
import { ProgramProvider } from "./program-context.js";
import { RevealSourceProvider, type RevealSourceCallback } from "./reveal-source-context.js";
import { TreeNavigation } from "./tree-navigation.js";
import style from "./type-graph.module.css";
import { TypeNodeView } from "./type-view/type-view.js";
import { TypeGraphNavigatorProvider, useTreeNavigator } from "./use-tree-navigation.js";

export function renderProgram(program: Program) {
  const html = ReactDOMServer.renderToString(
    <FluentProvider theme={webLightTheme}>
      <TypeGraph program={program} />
    </FluentProvider>,
  );
  return html;
}

/** Program and host integration options for the interactive {@link TypeGraph} viewer. */
export interface TypeGraphProps {
  /** Compiled program whose namespaces, types, and relationships the viewer displays. */
  readonly program: Program;
  /**
   * Called with the viewer's navigation path when a user selects a node.
   * Save this path to restore the selection later, or update {@link currentPath}
   * when controlling the selection from the host.
   */
  readonly onNavigationChange?: (path: string) => void;
  /**
   * Viewer navigation path to select, such as one received by {@link onNavigationChange}.
   * Omit to let the viewer manage selection; an empty string shows the root overview.
   * When supplied, update it in response to {@link onNavigationChange} to retain user navigation.
   */
  readonly currentPath?: string;
  /**
   * Initially restrict the navigation tree to types declared in the user project,
   * retaining any ancestors needed to reach them. Users can toggle this filter;
   * a selected library type remains visible in the details pane even when filtered out of the tree.
   * @default true
   */
  readonly defaultOnlyProjectCode?: boolean;
  /**
   * Called when the user clicks the source location of a type declared in their code.
   * Provide it when the host can reveal that location (e.g. an editor showing the project files).
   */
  readonly onRevealSource?: RevealSourceCallback;
}

/**
 * Browse a compiled program through a navigation tree and type details pane.
 *
 * Provides its own program and navigation contexts. The host must load
 * `@typespec/html-program-viewer/style.css` and provide a Fluent UI theme,
 * for example with `FluentProvider`.
 */
export const TypeGraph: FunctionComponent<TypeGraphProps> = ({
  program,
  onNavigationChange,
  currentPath,
  defaultOnlyProjectCode,
  onRevealSource,
}) => {
  return (
    <TypeGraphNavigatorProvider
      program={program}
      onNavigationChange={onNavigationChange}
      currentPath={currentPath}
      defaultOnlyProjectCode={defaultOnlyProjectCode}
    >
      <ProgramProvider value={program}>
        <RevealSourceProvider value={onRevealSource}>
          <SplitPane initialSizes={["200px", ""]} split="vertical" className={style["type-graph"]}>
            <Pane className={style["tree-navigation-pane"]}>
              <TreeNavigation />
            </Pane>
            <Pane className={style["view-pane"]}>
              <div className={style["current-path"]}>
                <CurrentPath />
              </div>
              <TypeGraphContent />
            </Pane>
          </SplitPane>
        </RevealSourceProvider>
      </ProgramProvider>
    </TypeGraphNavigatorProvider>
  );
};

const TypeGraphContent = () => {
  const nav = useTreeNavigator();

  return (
    <>
      {nav.selectionHiddenByFilter && <HiddenByFilter />}
      <TypeGraphNodeView />
    </>
  );
};

const TypeGraphNodeView = () => {
  const nav = useTreeNavigator();
  const node = nav.selectedNode;

  switch (node?.kind) {
    case "type":
      return <TypeNodeView nav={nav} node={node} />;
    case "list":
      return <ListTypeView nav={nav} node={node} />;
    default:
      return <ListTypeView nav={nav} node={nav.tree} />;
  }
};

/** Shown when navigating to a type that the navigation tree is currently hiding. */
const HiddenByFilter = () => {
  const nav = useTreeNavigator();
  return (
    <div className={style["hidden-by-filter"]}>
      <EyeOffRegular />
      <span className={style["hidden-by-filter-message"]}>
        Not part of your code, so not listed in the tree.
      </span>
      <Button
        className={style["hidden-by-filter-action"]}
        size="small"
        appearance="transparent"
        onClick={() => nav.setOnlyProjectCode(false)}
      >
        Show library types
      </Button>
    </div>
  );
};

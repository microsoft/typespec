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

export interface TypeGraphProps {
  readonly program: Program;
  readonly onNavigationChange?: (path: string) => void;
  readonly currentPath?: string;
  /**
   * If the graph should only show the types declared in the user project and hide the ones coming from the compiler or libraries.
   * @default true
   */
  readonly defaultOnlyProjectCode?: boolean;
  /**
   * Called when the user clicks the source location of a type declared in their code.
   * Provide it when the host can reveal that location(e.g. an editor showing the project files).
   */
  readonly onRevealSource?: RevealSourceCallback;
}

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

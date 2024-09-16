import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { Program } from "@typespec/compiler";
import { Pane, SplitPane } from "@typespec/react-components";
import { type FunctionComponent } from "react";
import ReactDOMServer from "react-dom/server";
import { CurrentPath } from "./current-path/current-path.js";
import { ListTypeView } from "./list-type-view/list-type-view.js";
import { ProgramProvider } from "./program-context.js";
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
}

export const TypeGraph: FunctionComponent<TypeGraphProps> = ({ program }) => {
  return (
    <TypeGraphNavigatorProvider program={program}>
      <ProgramProvider value={program}>
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
      </ProgramProvider>
    </TypeGraphNavigatorProvider>
  );
};

const TypeGraphContent = () => {
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

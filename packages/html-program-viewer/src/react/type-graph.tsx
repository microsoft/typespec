import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { Program } from "@typespec/compiler";
import { Pane, SplitPane } from "@typespec/react-components";
import { type FunctionComponent } from "react";
import ReactDOMServer from "react-dom/server";
import { ListNodeView } from "./list-node-view.js";
import { ProgramProvider } from "./program-context.js";
import { TreeNavigation } from "./tree-navigation.js";
import style from "./type-graph.module.css";
import { useTreeNavigator, type TreeNavigator } from "./use-tree-navigation.js";

export function renderProgram(program: Program) {
  const html = ReactDOMServer.renderToString(
    <FluentProvider theme={webLightTheme}>
      <TypeGraph program={program} />
    </FluentProvider>
  );
  return html;
}

export interface TypeGraphProps {
  readonly program: Program;
}

export const TypeGraph: FunctionComponent<TypeGraphProps> = ({ program }) => {
  const nav = useTreeNavigator(program);

  return (
    <ProgramProvider value={program}>
      <SplitPane initialSizes={["200px", ""]} split="vertical" className={style["type-graph"]}>
        <Pane className={style["tree-navigation-pane"]}>
          <TreeNavigation nav={nav} />
        </Pane>
        <Pane className={style["view-pane"]}>
          <TypeGraphContent nav={nav} />
        </Pane>
      </SplitPane>
    </ProgramProvider>
  );
};

const TypeGraphContent = ({ nav }: { nav: TreeNavigator }) => {
  const node = nav.selectedNode;

  switch (node?.kind) {
    case "type":
      return <div>Type: {(node.type as any).name}</div>;
    case "list":
      return <ListNodeView nav={nav} node={node} />;
    default:
      return <ListNodeView nav={nav} node={nav.tree} />;
  }
};

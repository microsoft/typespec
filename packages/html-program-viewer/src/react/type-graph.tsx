import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  FluentProvider,
  webLightTheme,
} from "@fluentui/react-components";
import type { Program } from "@typespec/compiler";
import { Pane, SplitPane } from "@typespec/react-components";
import { Fragment, type FunctionComponent } from "react";
import ReactDOMServer from "react-dom/server";
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
    </FluentProvider>
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
            <TypeGraphBreadcrumb />
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

const TypeGraphBreadcrumb = () => {
  const nav = useTreeNavigator();
  const segments = nav.selectedPath.split(".");

  return (
    <Breadcrumb size="small" className={style["breadcrumb"]}>
      {segments.map((x, i) => {
        const last = i === segments.length - 1;
        return (
          <Fragment key={x}>
            <BreadcrumbItem>
              <BreadcrumbButton
                current={last}
                onClick={() => nav.selectPath(segments.slice(0, i).join("."))}
              >
                {x}
              </BreadcrumbButton>
            </BreadcrumbItem>
            {!last && <BreadcrumbDivider />}
          </Fragment>
        );
      })}
    </Breadcrumb>
  );
};

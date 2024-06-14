import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { Program } from "@typespec/compiler";
import { Pane, SplitPane } from "@typespec/react-components";
import { type FunctionComponent } from "react";
import ReactDOMServer from "react-dom/server";
import { ProgramProvider } from "./program-context.js";
import { TreeNavigation } from "./tree-navigation.js";

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
    <ProgramProvider value={program}>
      <SplitPane initialSizes={["200px", ""]} split="vertical">
        <Pane>
          <TreeNavigation />
        </Pane>
        <Pane>
          <div>Content</div>
        </Pane>
      </SplitPane>
    </ProgramProvider>
  );
};

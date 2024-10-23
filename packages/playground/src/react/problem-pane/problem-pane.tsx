import type { Diagnostic } from "@typespec/compiler";
import type { FunctionComponent, MouseEventHandler } from "react";
import { DiagnosticList } from "../diagnostic-list/diagnostic-list.js";
import type { CompilationState } from "../types.js";
import { ProblemPaneHeader } from "./header.js";
import style from "./problem-pane.module.css";

export interface ProblemPaneProps {
  readonly collapsed: boolean;
  readonly compilationState: CompilationState | undefined;
  readonly onHeaderClick?: MouseEventHandler<HTMLDivElement>;
  readonly onDiagnosticSelected?: (diagnostic: Diagnostic) => void;
}
export const ProblemPane: FunctionComponent<ProblemPaneProps> = ({
  collapsed,
  compilationState,
  onHeaderClick,
  onDiagnosticSelected,
}) => {
  return (
    <div className={style["problem-pane"]}>
      <ProblemPaneHeader
        compilationState={compilationState}
        onClick={onHeaderClick}
        collaped={collapsed}
      />
      <div className={style["problem-content"]} aria-hidden={collapsed}>
        <ProblemPaneContent
          compilationState={compilationState}
          onDiagnosticSelected={onDiagnosticSelected}
        />
      </div>
    </div>
  );
};

interface ProblemPaneContentProps {
  readonly compilationState: CompilationState | undefined;
  readonly onDiagnosticSelected?: (diagnostic: Diagnostic) => void;
}
const ProblemPaneContent: FunctionComponent<ProblemPaneContentProps> = ({
  compilationState,
  onDiagnosticSelected,
}) => {
  if (compilationState === undefined) {
    return <></>;
  }
  if ("internalCompilerError" in compilationState) {
    return (
      <pre className={style["internal-compiler-error"]}>
        {String(compilationState.internalCompilerError)}
      </pre>
    );
  }
  const diagnostics = compilationState.program.diagnostics;
  return diagnostics.length === 0 ? (
    <div className={style["no-problems"]}> No problems</div>
  ) : (
    <DiagnosticList diagnostics={diagnostics} onDiagnosticSelected={onDiagnosticSelected} />
  );
};

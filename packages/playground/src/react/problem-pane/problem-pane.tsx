import { Diagnostic } from "@typespec/compiler";
import { FunctionComponent, MouseEventHandler } from "react";
import { DiagnosticList } from "../diagnostic-list/diagnostic-list.js";
import { CompilationState } from "../types.js";
import { ProblemPaneHeader } from "./header.js";
import style from "./problem-pane.module.css";

export interface ProblemPaneProps {
  readonly compilationState: CompilationState | undefined;
  readonly onHeaderClick?: MouseEventHandler<HTMLDivElement>;
  readonly onDiagnosticSelected?: (diagnostic: Diagnostic) => void;
}
export const ProblemPane: FunctionComponent<ProblemPaneProps> = ({
  compilationState,
  onHeaderClick,
  onDiagnosticSelected,
}) => {
  return (
    <div className={style["problem-pane"]}>
      <ProblemPaneHeader compilationState={compilationState} onClick={onHeaderClick} />
      <div className={style["problem-content"]}>
        <ProblemPaneContent
          compilationState={compilationState}
          onDiagnosticSelected={onDiagnosticSelected}
        />
      </div>
    </div>
  );
};

const ProblemPaneContent: FunctionComponent<ProblemPaneProps> = ({
  compilationState,
  onDiagnosticSelected,
}) => {
  if (compilationState === undefined) {
    return <></>;
  }
  if ("internalCompilerError" in compilationState) {
    return (
      <pre className={style["internal-compiler-error"]}>
        {compilationState.internalCompilerError.stack}
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

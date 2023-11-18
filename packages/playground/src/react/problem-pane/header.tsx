import { mergeClasses } from "@fluentui/react-components";
import { ChevronDown16Regular, ErrorCircle16Filled, Warning16Filled } from "@fluentui/react-icons";
import { MouseEventHandler, ReactNode, memo } from "react";
import { CompilationState } from "../types.js";
import style from "./header.module.css";

export interface ProblemPaneHeaderProps {
  compilationState: CompilationState | undefined;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export const ProblemPaneHeader = memo(({ compilationState, onClick }: ProblemPaneHeaderProps) => {
  const noProblem = (
    <Container status="none" onClick={onClick}>
      No problems
    </Container>
  );
  if (compilationState === undefined) {
    return noProblem;
  }
  if ("internalCompilerError" in compilationState) {
    return (
      <Container status="error" onClick={onClick}>
        <ErrorCircle16Filled /> Internal Compiler Error
      </Container>
    );
  }
  const diagnostics = compilationState.program.diagnostics;
  if (diagnostics.length === 0) {
    return noProblem;
  }
  const errors = diagnostics.filter((x) => x.severity === "error");
  const warnings = diagnostics.filter((x) => x.severity === "warning");
  return (
    <Container status={errors.length > 0 ? "error" : "warning"} onClick={onClick}>
      {errors.length > 0 ? (
        <>
          <ErrorCircle16Filled /> {errors.length} errors
        </>
      ) : null}
      {warnings.length > 0 ? (
        <>
          <Warning16Filled /> {warnings.length} warnings
        </>
      ) : null}
    </Container>
  );
});

interface ContainerProps {
  children?: ReactNode;
  className?: string;
  status: "error" | "warning" | "none";
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const Container = ({ children, className, status, onClick }: ContainerProps) => {
  return (
    <div
      tabIndex={onClick === undefined ? undefined : 0}
      className={mergeClasses(
        style["header"],
        status === "error" && style["header--error"],
        status === "warning" && style["header--warning"],
        className
      )}
      onClick={onClick}
    >
      <div className={style["header-content"]}>{children}</div>
      <ChevronDown16Regular />
    </div>
  );
};

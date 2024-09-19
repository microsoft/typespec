import { mergeClasses } from "@fluentui/react-components";
import { ChevronDown16Regular, ErrorCircle16Filled, Warning16Filled } from "@fluentui/react-icons";
import { memo, type MouseEventHandler, type ReactNode } from "react";
import type { CompilationState } from "../types.js";
import style from "./header.module.css";

export interface ProblemPaneHeaderProps {
  compilationState: CompilationState | undefined;
  onClick?: MouseEventHandler<HTMLDivElement>;
  collaped: boolean;
}

export const ProblemPaneHeader = memo(({ compilationState, ...props }: ProblemPaneHeaderProps) => {
  const noProblem = (
    <Container status="none" {...props}>
      No problems
    </Container>
  );
  if (compilationState === undefined) {
    return noProblem;
  }
  if ("internalCompilerError" in compilationState) {
    return (
      <Container status="error" {...props}>
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
    <Container status={errors.length > 0 ? "error" : "warning"} {...props}>
      {errors.length > 0 ? (
        <>
          <ErrorCircle16Filled className={style["error-icon"]} /> {errors.length} errors
        </>
      ) : null}
      {warnings.length > 0 ? (
        <>
          <Warning16Filled className={style["warning-icon"]} /> {warnings.length} warnings
        </>
      ) : null}
    </Container>
  );
});

interface ContainerProps {
  collaped: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  children?: ReactNode;
  className?: string;
  status: "error" | "warning" | "none";
}

const Container = ({ children, className, status, onClick, collaped }: ContainerProps) => {
  return (
    <div
      tabIndex={onClick === undefined ? undefined : 0}
      className={mergeClasses(
        style["header"],
        status === "error" && style["header--error"],
        status === "warning" && style["header--warning"],
        className,
      )}
      onClick={onClick}
    >
      <div className={style["header-content"]}>{children}</div>
      <ChevronDown16Regular
        className={mergeClasses(
          style["header-chevron"],
          collaped && style["header-chevron--collapsed"],
        )}
      />
    </div>
  );
};

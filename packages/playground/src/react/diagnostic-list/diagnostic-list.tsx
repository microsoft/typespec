import { mergeClasses } from "@fluentui/react-components";
import type { Diagnostic } from "@typespec/compiler";
import { FunctionComponent } from "react";
import style from "./diagnostic-list.module.css";

export interface DiagnosticListProps {
  readonly diagnostics: readonly Diagnostic[];
}

export const DiagnosticList: FunctionComponent<DiagnosticListProps> = ({ diagnostics }) => {
  if (diagnostics.length === 0) {
    return <div className={style["list"]}>No errors</div>;
  }
  return (
    <div className={style["list"]}>
      {diagnostics.map((x, i) => {
        return <DiagnosticItem key={i} diagnostic={x} />;
      })}
    </div>
  );
};

interface DiagnosticItemProps {
  readonly diagnostic: Diagnostic;
}

const DiagnosticItem: FunctionComponent<DiagnosticItemProps> = ({ diagnostic }) => {
  return (
    <div className={style["item"]}>
      <div
        className={mergeClasses(
          (style["item-severity"],
          style[diagnostic.severity === "error" ? "item--error" : "item--warning"])
        )}
      >
        {diagnostic.severity}
      </div>
      <div className={style["item-code"]}>{diagnostic.code}</div>
      <div className={style["item-message"]}>{diagnostic.message}</div>
    </div>
  );
};

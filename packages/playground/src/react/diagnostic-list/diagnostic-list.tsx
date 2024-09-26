import { mergeClasses } from "@fluentui/react-components";
import {
  getSourceLocation,
  type Diagnostic,
  type DiagnosticTarget,
  type NoTarget,
} from "@typespec/compiler";
import { memo, useCallback, type FunctionComponent } from "react";
import style from "./diagnostic-list.module.css";

export interface DiagnosticListProps {
  readonly diagnostics: readonly Diagnostic[];
  readonly onDiagnosticSelected?: (diagnostic: Diagnostic) => void;
}

export const DiagnosticList: FunctionComponent<DiagnosticListProps> = ({
  diagnostics,
  onDiagnosticSelected,
}) => {
  const handleItemSelected = useCallback(
    (diagnostic: Diagnostic) => {
      onDiagnosticSelected?.(diagnostic);
    },
    [onDiagnosticSelected],
  );
  if (diagnostics.length === 0) {
    return <div className={style["list"]}>No errors</div>;
  }
  return (
    <div className={style["list"]}>
      {diagnostics.map((x, i) => {
        return <DiagnosticItem key={i} diagnostic={x} onItemSelected={handleItemSelected} />;
      })}
    </div>
  );
};

interface DiagnosticItemProps {
  readonly diagnostic: Diagnostic;
  readonly onItemSelected: (diagnostic: Diagnostic) => void;
}

const DiagnosticItem: FunctionComponent<DiagnosticItemProps> = ({ diagnostic, onItemSelected }) => {
  const handleClick = useCallback(() => {
    onItemSelected(diagnostic);
  }, [diagnostic, onItemSelected]);
  return (
    <div tabIndex={0} className={style["item"]} onClick={handleClick}>
      <div
        className={mergeClasses(
          (style["item-severity"],
          style[diagnostic.severity === "error" ? "item--error" : "item--warning"]),
        )}
      >
        {diagnostic.severity}
      </div>
      <div className={style["item-code"]}>{diagnostic.code}</div>
      <div className={style["item-message"]}>{diagnostic.message}</div>
      <div className={style["item-loc"]}>
        <DiagnosticTargetLink target={diagnostic.target} />
      </div>
    </div>
  );
};

const DiagnosticTargetLink = memo(({ target }: { target: DiagnosticTarget | typeof NoTarget }) => {
  if (typeof target === "symbol") {
    return <span></span>;
  }
  const location = getSourceLocation(target);
  const file = location.file.path === "/test/main.tsp" ? "" : `${location.file.path}:`;
  const { line, character } = location.file.getLineAndCharacterOfPosition(location.pos);
  return (
    <span>
      {file}
      {line + 1}:{character + 1}
    </span>
  );
});

import { mergeClasses } from "@fluentui/react-components";
import {
  getSourceLocation,
  type Diagnostic,
  type DiagnosticTarget,
  type NoTarget,
} from "@typespec/compiler";
import { memo, useCallback, type FunctionComponent } from "react";
import style from "./diagnostic-list.module.css";

/** Diagnostics to display and an optional handler for navigating to a selected diagnostic. */
export interface DiagnosticListProps {
  /** Diagnostics displayed in the supplied order; an empty list shows "No errors". */
  readonly diagnostics: readonly Diagnostic[];
  /** Called with the clicked diagnostic; this component does not navigate to its source itself. */
  readonly onDiagnosticSelected?: (diagnostic: Diagnostic) => void;
}

/** Display diagnostic severity, code, message, and source location with optional click handling. */
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
  if (target === undefined) {
    return (
      <span title="Diagnostic didn't report a target. This is a bug on the emitter.">
        No target
      </span>
    );
  }
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

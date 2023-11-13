import { css } from "@emotion/react";
import { tokens } from "@fluentui/react-components";
import type { Diagnostic } from "@typespec/compiler";
import { FunctionComponent } from "react";

export interface DiagnosticListProps {
  readonly diagnostics: readonly Diagnostic[];
}

export const DiagnosticList: FunctionComponent<DiagnosticListProps> = ({ diagnostics }) => {
  if (diagnostics.length === 0) {
    return <div className="center">No errors</div>;
  }
  return (
    <div css={{ height: "100%", overflow: "auto" }}>
      {diagnostics.map((x, i) => {
        return <DiagnosticItem key={i} diagnostic={x} />;
      })}
    </div>
  );
};

export interface DiagnosticItemProps {
  readonly diagnostic: Diagnostic;
}

export const DiagnosticItem: FunctionComponent<DiagnosticItemProps> = ({ diagnostic }) => {
  return (
    <div css={{ display: "flex" }}>
      <div
        css={[{ padding: "0 5px" }, diagnostic.severity === "error" ? errorColor : warningColor]}
      >
        {diagnostic.severity}
      </div>
      <div css={{ padding: "0 5px", color: tokens.colorNeutralForeground2 }}>{diagnostic.code}</div>
      <div css={{ padding: "0 5px" }}>{diagnostic.message}</div>
    </div>
  );
};

const errorColor = css({ color: tokens.colorStatusDangerForeground1 });
const warningColor = css({ color: tokens.colorStatusWarningForeground1 });

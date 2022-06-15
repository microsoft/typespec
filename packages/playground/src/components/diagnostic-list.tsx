import { Diagnostic } from "@cadl-lang/compiler";
import { FunctionComponent } from "react";

export interface DiagnosticListProps {
  readonly diagnostics: readonly Diagnostic[];
}

export const DiagnosticList: FunctionComponent<DiagnosticListProps> = (props) => {
  return (
    <div>
      {props.diagnostics.map((x, i) => {
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
    <div className="diagnostic-item">
      <div className={`diagnostic-item-severity ${diagnostic.severity}`}>{diagnostic.severity}</div>
      <div className="diagnostic-item-code">{diagnostic.code}</div>
      <div className="diagnostic-item-message">{diagnostic.message}</div>
      <div className="diagnostic-item-location">{diagnostic.severity}</div>
    </div>
  );
};

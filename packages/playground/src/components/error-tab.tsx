import { Diagnostic } from "@cadl-lang/compiler";
import { FunctionComponent } from "react";
import { DiagnosticList } from "./diagnostic-list";

export interface ErrorTabProps {
  readonly internalCompilerError?: any;
  readonly diagnostics?: readonly Diagnostic[];
}

export const ErrorTab: FunctionComponent<ErrorTabProps> = ({
  internalCompilerError,
  diagnostics,
}) => {
  return (
    <>
      {internalCompilerError && <InternalCompilerError error={internalCompilerError} />}
      {diagnostics && <DiagnosticList diagnostics={diagnostics} />}
    </>
  );
};
export interface InternalCompilerErrorProps {
  readonly error?: any;
}

export const InternalCompilerError: FunctionComponent<InternalCompilerErrorProps> = ({ error }) => {
  return (
    <div className="center">
      <div className="internal-server-error">
        <h3>Internal Compiler error</h3>
        <div>File issue at https://github.com/microsoft/cadl</div>
        <hr />
        <div>{error.stack}</div>
      </div>
    </div>
  );
};

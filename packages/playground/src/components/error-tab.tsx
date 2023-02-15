import type { Diagnostic } from "@typespec/compiler";
import { css } from "@emotion/react";
import { FunctionComponent } from "react";
import { DiagnosticList } from "./diagnostic-list.js";

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
    <div css={{ CenterStyles }}>
      <div
        css={{
          border: "1px solid #cc2222",
          padding: "10px",
          margin: "20px",
        }}
      >
        <h3>Internal Compiler error</h3>
        <div>File issue at https://github.com/microsoft/typespec</div>
        <hr />
        <div>{error.stack}</div>
      </div>
    </div>
  );
};

const CenterStyles = css({
  display: "flex",
  height: "100%",
  alignItems: "center",
  justifyContent: "center",
});

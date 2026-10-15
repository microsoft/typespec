import { List } from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import * as ts from "@alloy-js/typescript";
import type { TypekitFunctionDoc } from "../typekit-docs.js";

export interface DiagnosableTypekitFunctionProps {
  readonly typekit: TypekitFunctionDoc;
}

export function DiagnosableTypekitFunction(props: DiagnosableTypekitFunctionProps) {
  const path = [`$(program)`, ...props.typekit.path];
  const parameters = props.typekit.parameters.map(
    (x) => `${x.rest ? "..." : ""}${x.name}${x.optional ? "?" : ""}: ${x.type}`,
  );
  const returnType = props.typekit.returnType;
  const typeParameters = props.typekit.typeParameters.length
    ? `<${props.typekit.typeParameters.join(", ")}>`
    : "";

  const accessorParts = path.map((x) => <ts.MemberExpression.Part id={x} />);

  const fnSig = (
    <>
      <ts.MemberExpression>
        {accessorParts}
        <ts.MemberExpression.Part args={parameters} />
      </ts.MemberExpression>
      {`: ${returnType};`}
    </>
  );
  const fnDiagSig = (
    <>
      <ts.MemberExpression>
        {accessorParts}
        <ts.MemberExpression.Part id="withDiagnostics" />
        <ts.MemberExpression.Part args={parameters} />
      </ts.MemberExpression>
      {`: [${returnType}, readonly Diagnostic[]];`}
    </>
  );
  return (
    <md.Section heading={`${props.typekit.name} <Badge variant="note" text="Diagnosable" />`}>
      <md.Code lang="ts">
        <List>
          {props.typekit.docComment}
          {typeParameters
            ? `${path.join(".")}${typeParameters}(${parameters.join(", ")}): ${returnType};`
            : fnSig}
          {typeParameters
            ? `${path.join(".")}.withDiagnostics${typeParameters}(${parameters.join(", ")}): [${returnType}, readonly Diagnostic[]];`
            : fnDiagSig}
        </List>
      </md.Code>
    </md.Section>
  );
}

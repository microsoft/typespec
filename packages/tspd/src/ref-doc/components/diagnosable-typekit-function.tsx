import { List } from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import * as ts from "@alloy-js/typescript";
import { TypekitFunctionDoc } from "../typekit-docs.js";

export interface DiagnosableTypekitFunctionProps {
  readonly typekit: TypekitFunctionDoc;
}

export function DiagnosableTypekitFunction(props: DiagnosableTypekitFunctionProps) {
  const path = [`$(program)`, ...props.typekit.path];
  const params = (props.typekit.parameters ?? []).map(
    (x) => `${x.name}${x.optional ? "?" : ""}: ${x.type}`,
  );
  const returnType = props.typekit.returnType;

  const accessorParts = path.map((x) => <ts.MemberExpression.Part id={x} />);

  const fnSig = (
    <>
      <ts.MemberExpression>
        {accessorParts}
        <ts.MemberExpression.Part args={[params.join(", ")]} />
      </ts.MemberExpression>
      {`: ${returnType};`}
    </>
  );
  const fnDiagSig = (
    <>
      <ts.MemberExpression>
        {accessorParts}
        <ts.MemberExpression.Part id="withDiagnostics" />
        <ts.MemberExpression.Part args={[params.join(", ")]} />
      </ts.MemberExpression>
      {`: [${returnType}, readonly Diagnostic[]];`}
    </>
  );
  return (
    <md.Section heading={`${props.typekit.name} <Badge variant="note" text="Diagnosable" />`}>
      <md.Code lang="ts">
        <List>
          {props.typekit.tsdoc}
          {fnSig}
          {fnDiagSig}
        </List>
      </md.Code>
    </md.Section>
  );
}

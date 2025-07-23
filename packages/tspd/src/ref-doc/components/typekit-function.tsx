import { List } from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import * as ts from "@alloy-js/typescript";
import { TypekitFunctionDoc } from "../typekit-docs.js";
import { DiagnosableTypekitFunction } from "./diagnosable-typekit-function.jsx";

export interface TypekitFunctionProps {
  readonly typekit: TypekitFunctionDoc;
}

export function TypekitFunction(props: TypekitFunctionProps) {
  if (props.typekit.kind === "diagnosable") {
    return <DiagnosableTypekitFunction typekit={props.typekit} />;
  }
  const path = [`$(program)`, ...props.typekit.path];
  const sig =
    props.typekit.kind === "getter" ? (
      <></>
    ) : (
      <ts.MemberExpression.Part
        args={props.typekit.parameters!.map((x) => `${x.name}: ${x.typeExcerpt.text}`)}
      />
    );
  return (
    <md.Section heading={props.typekit.name}>
      <List>
        {"```ts"}
        {props.typekit.docComment?.emitAsTsdoc().trimEnd()}
        <>
          <ts.MemberExpression>
            {path.map((x) => (
              <ts.MemberExpression.Part id={x} />
            ))}
            {sig}
          </ts.MemberExpression>
          <>: {props.typekit.returnTypeExcerpt.text};</>
        </>
        {"```"}
      </List>
    </md.Section>
  );
}

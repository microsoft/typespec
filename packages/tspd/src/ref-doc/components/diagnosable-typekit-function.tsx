import { List } from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import * as ts from "@alloy-js/typescript";
import { Excerpt, ExcerptToken } from "@microsoft/api-extractor-model";
import { TypekitFunctionDoc } from "../typekit-docs.js";

export interface DiagnosableTypekitFunctionProps {
  readonly typekit: TypekitFunctionDoc;
}

export function DiagnosableTypekitFunction(props: DiagnosableTypekitFunctionProps) {
  const path = [`$(program)`, ...props.typekit.path];
  const { parameters, returnType } = parseDiagnosableExcerpt(props.typekit.excerpt);

  const accessorParts = path.map((x) => <ts.MemberExpression.Part id={x} />);

  const fnSig = (
    <>
      <ts.MemberExpression>
        {accessorParts}
        <ts.MemberExpression.Part args={[renderTokens(parameters)]} />
      </ts.MemberExpression>
      {`: ${renderTokens(returnType)};`}
    </>
  );
  const fnDiagSig = (
    <>
      <ts.MemberExpression>
        {accessorParts}
        <ts.MemberExpression.Part id="withDiagnostics" />
        <ts.MemberExpression.Part args={[renderTokens(parameters)]} />
      </ts.MemberExpression>
      {`: [${renderTokens(returnType)}, readonly Diagnostic[]];`}
    </>
  );
  return (
    <md.Section heading={`${props.typekit.name} <Badge variant="note" text="Diagnosable" />`}>
      <md.Code lang="ts">
        <List>
          {props.typekit.docComment?.emitAsTsdoc().trimEnd()}
          {fnSig}
          {fnDiagSig}
        </List>
      </md.Code>
    </md.Section>
  );
}

function renderTokens(tokens: ExcerptToken[]): string {
  return tokens.map((x) => x.text).join("");
}

const ARROW_FN_SEPARATOR = ") => ";
function parseDiagnosableExcerpt(excerpt: Excerpt): {
  parameters: ExcerptToken[];
  returnType: ExcerptToken[];
} {
  const tokens = excerpt.spannedTokens.slice(1); // remove the function name Diagnosable
  tokens[0] = new ExcerptToken(tokens[0].kind, tokens[0].text.slice(2)); // remove <(
  tokens[tokens.length - 1] = new ExcerptToken(
    tokens[tokens.length - 1].kind,
    tokens[tokens.length - 1].text.slice(0, -1),
  ); // remove >
  const splitIndex = tokens.findIndex((x) => x.text.includes(ARROW_FN_SEPARATOR));
  if (splitIndex !== -1) {
    if (tokens[splitIndex].text === ARROW_FN_SEPARATOR) {
      const paramsTokens = tokens.slice(0, splitIndex);
      const returnTypeTokens = tokens.slice(splitIndex + 1);
      return {
        parameters: paramsTokens,
        returnType: returnTypeTokens,
      };
    } else {
      tokens[splitIndex] = new ExcerptToken(
        tokens[splitIndex].kind,
        tokens[splitIndex].text.replace(ARROW_FN_SEPARATOR, ""),
      );
      return {
        parameters: tokens.slice(0, splitIndex),
        returnType: tokens.slice(splitIndex),
      };
    }
  } else {
    throw new Error(`Cannot parse Diagnosable function signature: ${excerpt.text}.`);
  }
}

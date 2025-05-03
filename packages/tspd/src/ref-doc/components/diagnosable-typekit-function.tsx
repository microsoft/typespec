import * as ay from "@alloy-js/core";
import * as md from "@alloy-js/markdown";
import { Excerpt, ExcerptToken } from "@microsoft/api-extractor-model";
import { TypekitFunctionDoc } from "../typekit-docs.js";

export interface DiagnosableTypekitFunctionProps {
  readonly typekit: TypekitFunctionDoc;
}

export function DiagnosableTypekitFunction(props: DiagnosableTypekitFunctionProps) {
  const path = [`$(program)`, ...props.typekit.path];
  const { parameters, returnType } = parseDiagnosableExcerpt(props.typekit.excerpt);
  const accessor = path.join(".");
  const fnSig = `${accessor}(${renderTokens(parameters)}): ${renderTokens(returnType)};`;
  const fnDiagSig = `${accessor}.withDiagnostics(${renderTokens(parameters)}): [${renderTokens(returnType)}, readonly Diagnosable[]];`;
  return (
    <md.Section heading={props.typekit.path.join(".")}>
      <ay.List>
        <>Diagnosable API</>
        {"```ts"}
        {props.typekit.docComment?.emitAsTsdoc().trimEnd()}
        {fnSig}
        {fnDiagSig}
        {"```"}
      </ay.List>
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
    console.error("Cannot parse Diagnosable function signature", excerpt.spannedTokens);
    throw new Error(`Cannot parse Diagnosable function signature: ${excerpt.text}.`);
  }
}

import * as ay from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { type Type, getSourceLocation } from "@typespec/compiler";
import { DocTag, SyntaxKind } from "@typespec/compiler/ast";
import { typespecCompiler } from "../external-packages/compiler.js";
import { DecoratorSignature } from "../types.js";

export interface DecoratorSignatureProps {
  signature: DecoratorSignature;
}

/** Render the type of decorator implementation function  */
export function DecoratorSignatureType(props: Readonly<DecoratorSignatureProps>) {
  const parameters: ts.ParameterDescriptor[] = [
    {
      name: "context",
      type: typespecCompiler.DecoratorContext,
    },
  ];
  return (
    <ts.TypeDeclaration
      export
      name={props.signature.typeName}
      doc={getDocComment(props.signature.decorator)}
    >
      <ts.FunctionType parameters={parameters} />
    </ts.TypeDeclaration>
  );
}

function getDocComment(type: Type): string {
  const docs = type.node?.docs;
  if (docs === undefined || docs.length === 0) {
    return "";
  }

  const mainContentLines: string[] = [];
  const tagLines = [];
  for (const doc of docs) {
    for (const content of doc.content) {
      for (const line of content.text.split("\n")) {
        mainContentLines.push(line);
      }
    }
    for (const tag of doc.tags) {
      tagLines.push();

      let first = true;
      const hasContentFirstLine = checkIfTagHasDocOnSameLine(tag);
      const tagStart =
        tag.kind === SyntaxKind.DocParamTag || tag.kind === SyntaxKind.DocTemplateTag
          ? `@${tag.tagName.sv} ${tag.paramName.sv}`
          : `@${tag.tagName.sv}`;
      for (const content of tag.content) {
        for (const line of content.text.split("\n")) {
          const cleaned = sanitizeDocComment(line);
          if (first) {
            if (hasContentFirstLine) {
              tagLines.push(`${tagStart} ${cleaned}`);
            } else {
              tagLines.push(tagStart, cleaned);
            }

            first = false;
          } else {
            tagLines.push(cleaned);
          }
        }
      }
    }
  }

  const docLines = [...mainContentLines, ...(tagLines.length > 0 ? [""] : []), ...tagLines];
  return "/**\n" + docLines.map((x) => `* ${x}`).join("\n") + "\n*/\n";
}

function sanitizeDocComment(doc: string): string {
  // Issue to escape @internal and other tsdoc tags https://github.com/microsoft/TypeScript/issues/47679
  return doc.replaceAll("@internal", `@_internal`);
}

function checkIfTagHasDocOnSameLine(tag: DocTag): boolean {
  const start = tag.content[0]?.pos;
  const end = tag.content[0]?.end;
  const file = getSourceLocation(tag.content[0]).file;

  let hasFirstLine = false;
  for (let i = start; i < end; i++) {
    const ch = file.text[i];
    if (ch === "\n") {
      break;
    }
    // Todo reuse compiler whitespace logic or have a way to get this info from the parser.
    if (ch !== " ") {
      hasFirstLine = true;
    }
  }
  return hasFirstLine;
}

export function renderDecoratorSignature(signature: DecoratorSignature): string {
  const comp = <DecoratorSignatureType signature={signature} />;
  return ay.printTree(ay.renderTree(comp));
}

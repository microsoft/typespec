import {
  compilerAssert,
  Decorator,
  DocContent,
  DocUnknownTagNode,
  getSourceLocation,
  getTypeName,
  ignoreDiagnostics,
  Namespace,
  navigateTypesInNamespace,
  Program,
  SyntaxKind,
  Type,
} from "@cadl-lang/compiler";
import {
  CadlRefDoc,
  DecoratorRefDoc,
  ExampleRefDoc,
  FunctionParameterRefDoc,
  NamespaceRefDoc,
} from "./types.js";
import { getTypeSignature } from "./utils/type-signature.js";

export function extractRefDocs(program: Program, filterToNamespace: string[] = []): CadlRefDoc {
  const namespaceTypes = filterToNamespace
    .map((x) => ignoreDiagnostics(program.resolveTypeReference(x)))
    .filter((x): x is Namespace => x !== undefined);

  const refDoc: CadlRefDoc = {
    namespaces: [],
  };

  for (const namespace of namespaceTypes) {
    const namespaceDoc: NamespaceRefDoc = {
      fullName: getTypeName(namespace),
      decorators: [],
    };
    refDoc.namespaces.push(namespaceDoc);
    navigateTypesInNamespace(
      namespace,
      {
        decorator(dec) {
          namespaceDoc.decorators.push(extractDecoratorRefDoc(dec));
        },
      },
      { includeTemplateDeclaration: true }
    );
  }

  return refDoc;
}

function extractDecoratorRefDoc(decorator: Decorator): DecoratorRefDoc {
  let mainDoc: string = "";
  const paramDoc = getParameterDocumentation(decorator);
  const parameters: FunctionParameterRefDoc[] = decorator.parameters.map((x) => {
    return {
      type: x,
      doc: paramDoc.get(x.name) ?? "",
      name: x.name,
      optional: x.optional,
      rest: x.rest,
    };
  });
  const examples: ExampleRefDoc[] = [];
  for (const doc of decorator.node.docs ?? []) {
    for (const dContent of doc.content) {
      mainDoc += dContent.text + "\n";
    }

    for (const dTag of doc.tags) {
      switch (dTag.kind) {
        case SyntaxKind.DocUnknownTag:
          if (dTag.tagName.sv === "example") {
            examples.push(extractExample(dTag));
          }
          break;
        case SyntaxKind.DocParamTag:
          break;
      }
    }
  }

  return {
    name: decorator.name,
    type: decorator,
    signature: getTypeSignature(decorator),
    doc: mainDoc,
    parameters,
    examples,
    otherTags: [],
    target: {
      type: decorator.target,
      doc: paramDoc.get(decorator.target.name) ?? "",
      name: decorator.target.name,
      optional: decorator.target.optional,
      rest: decorator.target.rest,
    },
  };
}

function checkIfTagHasDocOnSameLine(tag: DocUnknownTagNode): boolean {
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
function extractExample(tag: DocUnknownTagNode): ExampleRefDoc {
  const content = getDocContent(tag.content);
  const hasInfoOnFirstLine = checkIfTagHasDocOnSameLine(tag);
  if (hasInfoOnFirstLine) {
    const [title, ...contents] = content.split("\n");
    return { title, content: contents.join("\n") };
  } else {
    return { content };
  }
}

function getParameterDocumentation(type: Type): Map<string, string> {
  const map = new Map<string, string>();
  for (const d of type?.node?.docs ?? []) {
    for (const tag of d.tags) {
      if (tag.kind === SyntaxKind.DocParamTag) {
        map.set(tag.paramName.sv, getDocContent(tag.content));
      }
    }
  }
  return map;
}

function getDocContent(content: readonly DocContent[]) {
  const docs = [];
  for (const node of content) {
    compilerAssert(
      node.kind === SyntaxKind.DocText,
      "No other doc content node kinds exist yet. Update this code appropriately when more are added."
    );
    docs.push(node.text);
  }
  return docs.join("");
}

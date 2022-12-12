import {
  compilerAssert,
  Decorator,
  DocContent,
  DocUnknownTagNode,
  getSourceLocation,
  getTypeName,
  ignoreDiagnostics,
  Interface,
  isTemplateDeclaration,
  Namespace,
  navigateTypesInNamespace,
  Operation,
  Program,
  SyntaxKind,
  TemplatedType,
  Type,
} from "@cadl-lang/compiler";
import {
  CadlRefDoc,
  DecoratorRefDoc,
  ExampleRefDoc,
  FunctionParameterRefDoc,
  InterfaceRefDoc,
  NamespaceRefDoc,
  OperationRefDoc,
} from "./types.js";
import { getQualifier, getTypeSignature } from "./utils/type-signature.js";

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
      operations: [],
      interfaces: [],
    };
    refDoc.namespaces.push(namespaceDoc);
    navigateTypesInNamespace(
      namespace,
      {
        decorator(dec) {
          namespaceDoc.decorators.push(extractDecoratorRefDoc(dec));
        },
        operation(operation) {
          if (operation.interface === undefined) {
            namespaceDoc.operations.push(extractOperationRefDoc(operation));
          }
        },
        interface(iface) {
          namespaceDoc.interfaces.push(extractInterfaceRefDocs(iface));
        },
      },
      { includeTemplateDeclaration: true, skipSubNamespaces: true }
    );
  }

  return refDoc;
}

function extractTemplateParameterDocs(type: TemplatedType) {
  if (isTemplateDeclaration(type)) {
    const templateParamsDocs = getTemplateParameterDocs(type);
    return type.node!.templateParameters.map((x) => ({
      name: x.id.sv,
      doc: templateParamsDocs.get(x.id.sv) ?? "",
    }));
  } else {
    return undefined;
  }
}

function extractInterfaceRefDocs(iface: Interface): InterfaceRefDoc {
  return {
    id: getNamedTypeId(iface),
    name: iface.name,
    signature: getTypeSignature(iface),
    type: iface,
    templateParameters: extractTemplateParameterDocs(iface),
    doc: extractMainDoc(iface),
    examples: extractExamples(iface),
  };
}

function extractOperationRefDoc(operation: Operation): OperationRefDoc {
  return {
    id: getNamedTypeId(operation),
    name: operation.name,
    signature: getTypeSignature(operation),
    type: operation,
    templateParameters: extractTemplateParameterDocs(operation),
    doc: extractMainDoc(operation),
    examples: extractExamples(operation),
  };
}

function extractDecoratorRefDoc(decorator: Decorator): DecoratorRefDoc {
  let mainDoc: string = "";
  const paramDoc = getParmeterDocs(decorator);
  const parameters: FunctionParameterRefDoc[] = decorator.parameters.map((x) => {
    return {
      type: x,
      doc: paramDoc.get(x.name) ?? "",
      name: x.name,
      optional: x.optional,
      rest: x.rest,
    };
  });

  const examples = extractExamples(decorator);
  return {
    id: getNamedTypeId(decorator),
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

function extractMainDoc(type: Type): string {
  let mainDoc: string = "";
  for (const doc of type.node?.docs ?? []) {
    for (const dContent of doc.content) {
      mainDoc += dContent.text + "\n";
    }
  }
  return mainDoc;
}

function extractExamples(type: Type): ExampleRefDoc[] {
  const examples: ExampleRefDoc[] = [];
  for (const doc of type.node?.docs ?? []) {
    for (const dTag of doc.tags) {
      if (dTag.kind === SyntaxKind.DocUnknownTag)
        if (dTag.tagName.sv === "example") {
          examples.push(extractExample(dTag));
        }
      break;
    }
  }
  return examples;
}

function getNamedTypeId(type: Type & { name: string }) {
  switch (type.kind) {
    case "Decorator":
      return getDecoratorId(type);
    case "Operation":
      return getQualifier(type.interface ?? type.namespace) + type.name;
    default:
      return "namespace" in type ? getQualifier(type.namespace) + type.name : type.name;
  }
}

function getDecoratorId(decorator: Decorator) {
  return "@" + getQualifier(decorator.namespace) + decorator.name.slice(1);
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

function getParmeterDocs(type: Type): Map<string, string> {
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

function getTemplateParameterDocs(type: Type): Map<string, string> {
  const map = new Map<string, string>();
  for (const d of type?.node?.docs ?? []) {
    for (const tag of d.tags) {
      if (tag.kind === SyntaxKind.DocTemplateTag) {
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

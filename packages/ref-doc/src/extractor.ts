import {
  compile,
  compilerAssert,
  createDiagnosticCollector,
  Decorator,
  Diagnostic,
  DocContent,
  DocUnknownTagNode,
  Enum,
  getDoc,
  getSourceLocation,
  getTypeName,
  ignoreDiagnostics,
  Interface,
  isDeclaredType,
  isTemplateDeclaration,
  joinPaths,
  JSONSchemaType,
  Model,
  Namespace,
  navigateTypesInNamespace,
  NodeHost,
  NodePackage,
  NoTarget,
  Operation,
  Program,
  resolvePath,
  Scalar,
  SyntaxKind,
  TemplatedType,
  Type,
  TypeSpecLibrary,
  Union,
} from "@typespec/compiler";
import { readFile } from "fs/promises";
import { reportDiagnostic } from "./lib.js";
import {
  DecoratorRefDoc,
  EmitterOptionRefDoc,
  EnumRefDoc,
  ExampleRefDoc,
  FunctionParameterRefDoc,
  InterfaceRefDoc,
  ModelRefDoc,
  NamespaceRefDoc,
  OperationRefDoc,
  ScalarRefDoc,
  TypeSpecLibraryRefDoc,
  TypeSpecRefDocBase,
  UnionRefDoc,
} from "./types.js";
import { getQualifier, getTypeSignature } from "./utils/type-signature.js";

export async function extractLibraryRefDocs(
  libraryPath: string,
  namespaces: string[]
): Promise<[TypeSpecLibraryRefDoc, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  const refDoc: TypeSpecLibraryRefDoc = { name: pkgJson.name, namespaces: [] };
  if (pkgJson.tspMain) {
    const main = resolvePath(libraryPath, pkgJson.tspMain);
    const program = await compile(NodeHost, main, {
      parseOptions: { comments: true, docs: true },
    });
    refDoc.namespaces = extractRefDocs(program, namespaces).namespaces;
    for (const diag of program.diagnostics ?? []) {
      diagnostics.add(diag);
    }
  }

  if (pkgJson.main) {
    const entrypoint = await import(resolvePath(libraryPath, pkgJson.main));
    const lib: TypeSpecLibrary<any> | undefined = entrypoint.$lib;
    if (lib?.emitter?.options) {
      refDoc.emitter = {
        options: extractEmitterOptionsRefDoc(lib.emitter.options),
      };
    }
  }

  return diagnostics.wrap(refDoc);
}

async function readPackageJson(libraryPath: string): Promise<NodePackage> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}

export function extractRefDocs(
  program: Program,
  filterToNamespace: string[] = []
): TypeSpecRefDocBase {
  const namespaceTypes = filterToNamespace
    .map((x) => ignoreDiagnostics(program.resolveTypeReference(x)))
    .filter((x): x is Namespace => x !== undefined);

  const refDoc: TypeSpecRefDocBase = {
    namespaces: [],
  };

  for (const namespace of namespaceTypes) {
    const namespaceDoc: NamespaceRefDoc = {
      id: getTypeName(namespace),
      decorators: [],
      operations: [],
      interfaces: [],
      models: [],
      enums: [],
      unions: [],
      scalars: [],
    };

    refDoc.namespaces.push(namespaceDoc);
    navigateTypesInNamespace(
      namespace,
      {
        decorator(dec) {
          namespaceDoc.decorators.push(extractDecoratorRefDoc(program, dec));
        },
        operation(operation) {
          if (!isDeclaredType(operation)) {
            return;
          }
          if (operation.interface === undefined) {
            namespaceDoc.operations.push(extractOperationRefDoc(program, operation, undefined));
          }
        },
        interface(iface) {
          if (!isDeclaredType(iface)) {
            return;
          }
          namespaceDoc.interfaces.push(extractInterfaceRefDocs(program, iface));
        },
        model(model) {
          if (!isDeclaredType(model)) {
            return;
          }
          if (model.name === "") {
            return;
          }
          namespaceDoc.models.push(extractModelRefDocs(program, model));
        },
        enum(e) {
          if (!isDeclaredType(e)) {
            return;
          }
          namespaceDoc.enums.push(extractEnumRefDoc(program, e));
        },
        union(union) {
          if (!isDeclaredType(union)) {
            return;
          }
          if (union.name !== undefined) {
            namespaceDoc.unions.push(extractUnionRefDocs(program, union as any));
          }
        },
        scalar(scalar) {
          namespaceDoc.scalars.push(extractScalarRefDocs(program, scalar as any));
        },
      },
      { includeTemplateDeclaration: true, skipSubNamespaces: true }
    );
  }

  sort(refDoc.namespaces);
  for (const namespace of refDoc.namespaces) {
    sort(namespace.decorators);
    sort(namespace.enums);
    sort(namespace.interfaces);
    sort(namespace.models);
    sort(namespace.operations);
    sort(namespace.unions);
    sort(namespace.scalars);
  }

  function sort(arr: { id: string }[]) {
    arr.sort((a, b) => a.id.localeCompare(b.id, "en"));
  }

  return refDoc;
}

function extractTemplateParameterDocs(program: Program, type: TemplatedType) {
  if (isTemplateDeclaration(type)) {
    const templateParamsDocs = getTemplateParameterDocs(type);
    return type.node!.templateParameters.map((x) => {
      const doc = templateParamsDocs.get(x.id.sv);
      if (doc === undefined || doc === "") {
        reportDiagnostic(program, {
          code: "documentation-missing",
          messageId: "templateParam",
          format: { name: type.name ?? "", param: x.id.sv },
          target: NoTarget,
        });
      }
      return {
        name: x.id.sv,
        doc: templateParamsDocs.get(x.id.sv) ?? "",
      };
    });
  } else {
    return undefined;
  }
}

function extractInterfaceRefDocs(program: Program, iface: Interface): InterfaceRefDoc {
  const doc = extractMainDoc(program, iface);
  if (doc === undefined || doc === "") {
    reportDiagnostic(program, {
      code: "documentation-missing",
      messageId: "interface",
      format: { name: iface.name ?? "" },
      target: NoTarget,
    });
  }
  return {
    id: getNamedTypeId(iface),
    name: iface.name,
    signature: getTypeSignature(iface),
    type: iface,
    templateParameters: extractTemplateParameterDocs(program, iface),
    interfaceOperations: [...iface.operations.values()].map((x) =>
      extractOperationRefDoc(program, x, iface.name)
    ),
    doc: doc,
    examples: extractExamples(iface),
  };
}

function extractOperationRefDoc(
  program: Program,
  operation: Operation,
  interfaceName: string | undefined
): OperationRefDoc {
  const doc = extractMainDoc(program, operation);
  if (doc === undefined || doc === "") {
    if (operation.interface !== undefined) {
      reportDiagnostic(program, {
        code: "documentation-missing",
        messageId: "interfaceOperation",
        format: { name: `${operation.interface.name}.${operation.name}` ?? "" },
        target: NoTarget,
      });
    } else {
      reportDiagnostic(program, {
        code: "documentation-missing",
        messageId: "operation",
        format: { name: operation.name ?? "" },
        target: NoTarget,
      });
    }
  }
  return {
    id: getNamedTypeId(operation),
    name: interfaceName ? `${interfaceName}.${operation.name}` : operation.name,
    signature: getTypeSignature(operation),
    type: operation,
    templateParameters: extractTemplateParameterDocs(program, operation),
    doc: doc,
    examples: extractExamples(operation),
  };
}

function extractDecoratorRefDoc(program: Program, decorator: Decorator): DecoratorRefDoc {
  const paramDoc = getParmeterDocs(decorator);
  const parameters: FunctionParameterRefDoc[] = decorator.parameters.map((x) => {
    const docVal = paramDoc.get(x.name);
    if (docVal === undefined || docVal === "") {
      reportDiagnostic(program, {
        code: "documentation-missing",
        messageId: "decoratorParam",
        format: { name: decorator.name, param: x.name },
        target: NoTarget,
      });
    }
    return {
      type: x,
      doc: paramDoc.get(x.name) ?? "",
      name: x.name,
      optional: x.optional,
      rest: x.rest,
    };
  });

  const examples = extractExamples(decorator);
  const mainDoc = extractMainDoc(program, decorator);
  if (mainDoc === undefined || mainDoc === "") {
    reportDiagnostic(program, {
      code: "documentation-missing",
      messageId: "decorator",
      format: { name: decorator.name },
      target: NoTarget,
    });
  }
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

function extractModelRefDocs(program: Program, type: Model): ModelRefDoc {
  const doc = extractMainDoc(program, type);
  if (doc === undefined || doc === "") {
    reportDiagnostic(program, {
      code: "documentation-missing",
      messageId: "model",
      format: { name: type.name ?? "" },
      target: NoTarget,
    });
  }
  return {
    id: getNamedTypeId(type),
    name: type.name,
    signature: getTypeSignature(type),
    type,
    templateParameters: extractTemplateParameterDocs(program, type),
    doc: doc,
    examples: extractExamples(type),
  };
}

function extractEnumRefDoc(program: Program, type: Enum): EnumRefDoc {
  const doc = extractMainDoc(program, type);
  if (doc === undefined || doc === "") {
    reportDiagnostic(program, {
      code: "documentation-missing",
      messageId: "enum",
      format: { name: type.name ?? "" },
      target: NoTarget,
    });
  }
  return {
    id: getNamedTypeId(type),
    name: type.name,
    signature: getTypeSignature(type),
    type,
    doc: doc,
    examples: extractExamples(type),
  };
}
function extractUnionRefDocs(program: Program, type: Union & { name: string }): UnionRefDoc {
  const doc = extractMainDoc(program, type);
  if (doc === undefined || doc === "") {
    reportDiagnostic(program, {
      code: "documentation-missing",
      messageId: "union",
      format: { name: type.name ?? "" },
      target: NoTarget,
    });
  }
  return {
    id: getNamedTypeId(type),
    name: type.name,
    signature: getTypeSignature(type),
    type,
    templateParameters: extractTemplateParameterDocs(program, type),
    doc: doc,
    examples: extractExamples(type),
  };
}

function extractScalarRefDocs(program: Program, type: Scalar): ScalarRefDoc {
  const doc = extractMainDoc(program, type);
  if (doc === undefined || doc === "") {
    reportDiagnostic(program, {
      code: "documentation-missing",
      messageId: "scalar",
      format: { name: type.name ?? "" },
      target: NoTarget,
    });
  }
  return {
    id: getNamedTypeId(type),
    name: type.name,
    signature: getTypeSignature(type),
    type,
    doc: doc,
    examples: extractExamples(type),
  };
}

function extractMainDoc(program: Program, type: Type): string {
  let mainDoc: string = "";
  for (const doc of type.node?.docs ?? []) {
    for (const dContent of doc.content) {
      mainDoc += dContent.text + "\n";
    }
  }
  return mainDoc !== "" ? mainDoc : getDoc(program, type) ?? "";
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

function extractEmitterOptionsRefDoc(
  options: JSONSchemaType<Record<string, never>>
): EmitterOptionRefDoc[] {
  return Object.entries(options.properties).map(([name, value]: [string, any]) => {
    return {
      name,
      type: value.enum
        ? value.enum.map((x: string | number) => (typeof x === "string" ? `"${x}"` : x)).join(" | ")
        : value.type,
      doc: value.description ?? "",
    };
  });
}

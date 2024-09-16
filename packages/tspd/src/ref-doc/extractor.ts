import {
  compile,
  compilerAssert,
  createDiagnosticCollector,
  Decorator,
  Diagnostic,
  DocContent,
  DocUnknownTagNode,
  Enum,
  EnumMember,
  getDeprecated,
  getDoc,
  getLocationContext,
  getSourceLocation,
  getTypeName,
  Interface,
  isDeclaredType,
  isTemplateDeclaration,
  joinPaths,
  JSONSchemaType,
  LinterResolvedDefinition,
  LinterRuleDefinition,
  LinterRuleSet,
  Model,
  ModelProperty,
  Namespace,
  navigateProgram,
  navigateTypesInNamespace,
  NodeHost,
  NodePackage,
  NoTarget,
  Operation,
  Program,
  resolveLinterDefinition,
  resolvePath,
  Scalar,
  SyntaxKind,
  TemplatedType,
  Type,
  TypeSpecLibrary,
  Union,
} from "@typespec/compiler";
import { readFile } from "fs/promises";
import { pathToFileURL } from "url";
import { reportDiagnostic } from "./lib.js";
import {
  DecoratorRefDoc,
  DeprecationNotice,
  EmitterOptionRefDoc,
  EnumMemberRefDoc,
  EnumRefDoc,
  ExampleRefDoc,
  FunctionParameterRefDoc,
  InterfaceRefDoc,
  LinterRefDoc,
  LinterRuleRefDoc,
  LinterRuleSetRefDoc,
  ModelPropertyRefDoc,
  ModelRefDoc,
  NamespaceRefDoc,
  OperationRefDoc,
  RefDocEntity,
  ReferencableElement,
  ScalarRefDoc,
  TypeSpecLibraryRefDoc,
  TypeSpecRefDocBase,
  UnionRefDoc,
} from "./types.js";
import { getQualifier, getTypeSignature } from "./utils/type-signature.js";

/**
 * The mutable equivalent of a type.
 */

//prettier-ignore
type Mutable<T> =
  T extends ReadonlyMap<infer K, infer V> ? Map<K, V> :
  T extends ReadonlySet<infer T> ? Set<Mutable<T>> :
  T extends readonly (infer V)[] ? V[] :
  // brand to force explicit conversion.
  { -readonly [P in keyof T]: T[P]};

export async function extractLibraryRefDocs(
  libraryPath: string,
): Promise<[TypeSpecLibraryRefDoc, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();
  const pkgJson = await readPackageJson(libraryPath);
  const refDoc: Mutable<TypeSpecLibraryRefDoc> = {
    name: pkgJson.name,
    description: pkgJson.description,
    packageJson: pkgJson,
    namespaces: [],
    getNamedTypeRefDoc: (type) => undefined,
  };
  if (pkgJson.tspMain) {
    const main = resolvePath(libraryPath, pkgJson.tspMain);
    const program = await compile(NodeHost, main, {
      parseOptions: { comments: true, docs: true },
    });
    const tspEmitter = diagnostics.pipe(extractRefDocs(program));
    Object.assign(refDoc, tspEmitter);
    for (const diag of program.diagnostics ?? []) {
      diagnostics.add(diag);
    }
  }

  if (pkgJson.main) {
    const entrypoint = await import(pathToFileURL(resolvePath(libraryPath, pkgJson.main)).href);
    const lib: TypeSpecLibrary<any> | undefined = entrypoint.$lib;
    if (lib?.emitter?.options) {
      refDoc.emitter = {
        options: extractEmitterOptionsRefDoc(lib.emitter.options),
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const linter = entrypoint.$linter ?? lib?.linter;
    if (lib && linter) {
      refDoc.linter = extractLinterRefDoc(lib.name, resolveLinterDefinition(lib.name, linter));
    }
  }

  return diagnostics.wrap(refDoc);
}

async function readPackageJson(libraryPath: string): Promise<NodePackage> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}

export interface ExtractRefDocOptions {
  namespaces?: {
    include?: string[];
    exclude?: string[];
  };
}

function resolveNamespaces(
  program: Program,
  options: ExtractRefDocOptions,
): [Namespace[], readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  let namespaceTypes: Namespace[] = [];

  const { include, exclude } = options?.namespaces ?? {};
  if (include) {
    namespaceTypes = include
      .map((x) => diagnostics.pipe(program.resolveTypeReference(x)))
      .filter((x): x is Namespace => x !== undefined);
  }
  navigateProgram(program, {
    namespace(namespace) {
      if (getLocationContext(program, namespace).type !== "project") {
        return;
      }
      if (namespace.name === "Private") {
        return;
      }
      namespaceTypes.push(namespace);
    },
  });

  if (exclude !== undefined) {
    namespaceTypes = namespaceTypes.filter((x) => {
      return exclude.includes(getTypeName(x));
    });
  }
  return diagnostics.wrap(namespaceTypes);
}

export function extractRefDocs(
  program: Program,
  options: ExtractRefDocOptions = {},
): [TypeSpecRefDocBase, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const namespaceTypes = diagnostics.pipe(resolveNamespaces(program, options));
  const typeMapping = new Map<Type, RefDocEntity>();
  const namespaces: Mutable<NamespaceRefDoc>[] = [];

  for (const namespace of namespaceTypes) {
    const name = getTypeName(namespace);
    const namespaceDoc: Mutable<NamespaceRefDoc> = {
      kind: "namespace",
      id: name,
      name,
      decorators: [],
      operations: [],
      interfaces: [],
      models: [],
      enums: [],
      unions: [],
      scalars: [],
    };

    namespaces.push(namespaceDoc);
    function collectType<T extends RefDocEntity>(type: Type, refDoc: T, array: T[] | readonly T[]) {
      typeMapping.set(type, refDoc);
      (array as any).push(refDoc);
    }
    navigateTypesInNamespace(
      namespace,
      {
        decorator(dec) {
          collectType(dec, extractDecoratorRefDoc(program, dec), namespaceDoc.decorators);
        },
        operation(operation) {
          if (!isDeclaredType(operation)) {
            return;
          }

          if (operation.interface === undefined) {
            collectType(
              operation,
              extractOperationRefDoc(program, operation, undefined),
              namespaceDoc.operations,
            );
          }
        },
        interface(iface) {
          if (!isDeclaredType(iface)) {
            return;
          }
          collectType(iface, extractInterfaceRefDocs(program, iface), namespaceDoc.interfaces);
        },
        model(model) {
          if (!isDeclaredType(model)) {
            return;
          }
          if (model.name === "") {
            return;
          }
          collectType(model, extractModelRefDocs(program, model), namespaceDoc.models);
        },
        enum(e) {
          if (!isDeclaredType(e)) {
            return;
          }
          collectType(e, extractEnumRefDoc(program, e), namespaceDoc.enums);
        },
        union(union) {
          if (!isDeclaredType(union)) {
            return;
          }
          if (union.name !== undefined) {
            collectType(union, extractUnionRefDocs(program, union as any), namespaceDoc.unions);
          }
        },
        scalar(scalar) {
          collectType(scalar, extractScalarRefDocs(program, scalar), namespaceDoc.scalars);
        },
      },
      { includeTemplateDeclaration: true, skipSubNamespaces: true },
    );
  }

  sort(namespaces);
  for (const namespace of namespaces) {
    sort(namespace.decorators);
    sort(namespace.enums);
    sort(namespace.interfaces);
    sort(namespace.models);
    sort(namespace.operations);
    sort(namespace.unions);
    sort(namespace.scalars);
  }

  function sort(arr: { id: string }[] | readonly { id: string }[]) {
    (arr as { id: string }[]).sort((a, b) => a.id.localeCompare(b.id, "en"));
  }

  return diagnostics.wrap({
    namespaces,
    getNamedTypeRefDoc: (type) => typeMapping.get(type),
  });
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
    kind: "interface",
    ...extractBase(program, iface),
    signature: getTypeSignature(iface),
    type: iface,
    templateParameters: extractTemplateParameterDocs(program, iface),
    interfaceOperations: [...iface.operations.values()].map((x) =>
      extractOperationRefDoc(program, x, iface.name),
    ),
    doc: doc,
    examples: extractExamples(iface),
  };
}

function extractBase(
  program: Program,
  type: Type & { name: string },
): ReferencableElement & { readonly deprecated?: DeprecationNotice } {
  const deprecated = getDeprecated(program, type);

  return {
    id: getNamedTypeId(type),
    name: type.name,
    deprecated: deprecated ? { message: deprecated } : undefined,
  };
}

function extractOperationRefDoc(
  program: Program,
  operation: Operation,
  interfaceName: string | undefined,
): OperationRefDoc {
  const doc = extractMainDoc(program, operation);
  if (doc === undefined || doc === "") {
    if (operation.interface !== undefined) {
      reportDiagnostic(program, {
        code: "documentation-missing",
        messageId: "interfaceOperation",
        format: { name: `${operation.interface.name}.${operation.name}` },
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
    kind: "operation",
    ...extractBase(program, operation),
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
      kind: "decorator",
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
    kind: "decorator",
    ...extractBase(program, decorator),
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
    kind: "model",
    ...extractBase(program, type),
    signature: getTypeSignature(type),
    type,
    templateParameters: extractTemplateParameterDocs(program, type),
    doc: doc,
    examples: extractExamples(type),
    properties: new Map(
      [...type.properties.values()].map((x) => [x.name, extractModelPropertyRefDocs(program, x)]),
    ),
  };
}

function extractModelPropertyRefDocs(program: Program, type: ModelProperty): ModelPropertyRefDoc {
  const doc = extractMainDoc(program, type);
  return {
    ...extractBase(program, type),
    signature: getTypeSignature(type),
    type,
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
    kind: "enum",
    ...extractBase(program, type),
    signature: getTypeSignature(type),
    type,
    doc: doc,
    examples: extractExamples(type),
    members: new Map(
      [...type.members.values()].map((x) => [x.name, extractEnumMemberRefDocs(program, x)]),
    ),
  };
}

function extractEnumMemberRefDocs(program: Program, type: EnumMember): EnumMemberRefDoc {
  const doc = extractMainDoc(program, type);
  return {
    ...extractBase(program, type),
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
    kind: "union",
    ...extractBase(program, type),
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
    kind: "scalar",
    ...extractBase(program, type),
    signature: getTypeSignature(type),
    type,
    doc: doc,
    examples: extractExamples(type),
  };
}

function extractMainDoc(program: Program, type: Type): string {
  const mainDocs: string[] = [];
  for (const doc of type.node?.docs ?? []) {
    for (const dContent of doc.content) {
      mainDocs.push(dContent.text);
    }
  }
  return mainDocs.length > 0 ? mainDocs.join("\n") : (getDoc(program, type) ?? "");
}

function extractExamples(type: Type): ExampleRefDoc[] {
  const examples: ExampleRefDoc[] = [];
  for (const doc of type.node?.docs ?? []) {
    for (const dTag of doc.tags) {
      if (dTag.kind === SyntaxKind.DocUnknownTag) {
        if (dTag.tagName.sv === "example") {
          examples.push(extractExample(dTag));
        }
      }
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
      "No other doc content node kinds exist yet. Update this code appropriately when more are added.",
    );
    docs.push(node.text);
  }
  return docs.join("");
}

function extractEmitterOptionsRefDoc(
  options: JSONSchemaType<Record<string, never>>,
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

function extractLinterRefDoc(libName: string, linter: LinterResolvedDefinition): LinterRefDoc {
  return {
    ruleSets: linter.ruleSets && extractLinterRuleSetsRefDoc(libName, linter.ruleSets),
    rules: linter.rules.map((rule) => extractLinterRuleRefDoc(libName, rule)),
  };
}

function extractLinterRuleSetsRefDoc(
  libName: string,
  ruleSets: Record<string, LinterRuleSet>,
): LinterRuleSetRefDoc[] {
  return Object.entries(ruleSets).map(([name, ruleSet]) => {
    const fullName = `${libName}/${name}`;
    return {
      kind: "ruleset",
      id: fullName,
      name: fullName,
      ruleSet,
    };
  });
}
function extractLinterRuleRefDoc(
  libName: string,
  rule: LinterRuleDefinition<any, any>,
): LinterRuleRefDoc {
  const fullName = `${libName}/${rule.name}`;
  return {
    kind: "rule",
    id: fullName,
    name: fullName,
    rule,
  };
}

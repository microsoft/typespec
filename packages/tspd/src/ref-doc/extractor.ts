import {
  compile,
  compilerAssert,
  createDiagnosticCollector,
  Decorator,
  Diagnostic,
  DiagnosticDefinition,
  DocContent,
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
  NoTarget,
  Operation,
  Program,
  resolveLinterDefinition,
  resolvePath,
  Scalar,
  TemplatedType,
  Type,
  TypeSpecLibrary,
  Union,
  UnionVariant,
  type FileRef,
  type PackageJson,
} from "@typespec/compiler";
import { SyntaxKind, type DocUnknownTagNode } from "@typespec/compiler/ast";
import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import { pathToFileURL } from "url";
import { createDiagnostic, reportDiagnostic } from "./lib.js";
import {
  DecoratorRefDoc,
  DeprecationNotice,
  DiagnosticRefDoc,
  EmitterOptionRefDoc,
  EmitterOptionVariantRefDoc,
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
  SubExportRefDoc,
  TypeSpecLibraryRefDoc,
  TypeSpecRefDocBase,
  UnionRefDoc,
  UnionVariantRefDoc,
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

function getExport(pkgJson: PackageJson, path: string, condition: string) {
  return (pkgJson as any).exports?.[path]?.[condition];
}

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
  const tspMain = getExport(pkgJson, ".", "typespec");
  let mainSourceFiles: Set<string> | undefined;
  if (tspMain) {
    const main = resolvePath(libraryPath, tspMain);
    const program = await compile(NodeHost, main, {
      parseOptions: { comments: true, docs: true },
    });
    mainSourceFiles = new Set(program.sourceFiles.keys());
    const tspEmitter = diagnostics.pipe(extractRefDocs(program));
    Object.assign(refDoc, tspEmitter);
    for (const diag of program.diagnostics ?? []) {
      diagnostics.add(diag);
    }
  }

  const main = getExport(pkgJson, ".", "import") ?? getExport(pkgJson, ".", "default");
  if (main) {
    const entrypoint = await import(pathToFileURL(resolvePath(libraryPath, main)).href);
    const lib: TypeSpecLibrary<any> | undefined = entrypoint.$lib;
    if (lib?.emitter?.options) {
      refDoc.emitter = {
        options: extractEmitterOptionsRefDoc(lib.emitter.options),
      };
    }
    const linter = entrypoint.$linter;
    if (lib && linter) {
      const resolved = resolveLinterDefinition(lib.name, linter, lib.referenceDocs?.baseUrl);
      refDoc.linter = extractLinterRefDoc(lib.name, resolved, libraryPath);
      for (const r of refDoc.linter.rules) {
        if (!r.doc) {
          diagnostics.add(
            createDiagnostic({
              code: "documentation-missing",
              messageId: "rule",
              format: { name: r.id },
              target: NoTarget,
            }),
          );
        }
      }
    }
    if (lib?.diagnostics) {
      refDoc.diagnostics = extractDiagnosticsRefDoc(
        lib.name,
        lib.diagnostics as Record<string, DiagnosticDefinition<any>>,
        libraryPath,
      );
      for (const diag of refDoc.diagnostics) {
        if (!diag.doc) {
          diagnostics.add(
            createDiagnostic({
              code: "documentation-missing",
              messageId: "diagnostic",
              format: { name: diag.id },
              target: NoTarget,
            }),
          );
        }
      }
    }
  }

  // Extract sub-exports
  const subExports = await extractSubExports(libraryPath, pkgJson, diagnostics, mainSourceFiles);
  if (subExports.size > 0) {
    refDoc.subExports = subExports;
  }

  return diagnostics.wrap(refDoc);
}

async function readPackageJson(libraryPath: string): Promise<PackageJson> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}

async function extractSubExports(
  libraryPath: string,
  pkgJson: PackageJson,
  diagnostics: { pipe: <T>(result: [T, readonly Diagnostic[]]) => T; add: (d: Diagnostic) => void },
  mainSourceFiles?: Set<string>,
): Promise<Map<string, SubExportRefDoc>> {
  const subExports = new Map<string, SubExportRefDoc>();
  const exports = (pkgJson as any).exports;
  if (!exports || typeof exports !== "object") {
    return subExports;
  }

  for (const [exportPath, exportValue] of Object.entries<any>(exports)) {
    // Skip the main export — already handled
    if (exportPath === ".") continue;

    // Only process exports that have a typespec condition
    const tspEntry = exportValue?.typespec;
    if (!tspEntry) continue;

    const main = resolvePath(libraryPath, tspEntry);
    try {
      const program = await compile(NodeHost, main, {
        parseOptions: { comments: true, docs: true },
      });
      const subRefDoc = diagnostics.pipe(
        extractRefDocs(program, {
          sourceFilter: mainSourceFiles
            ? (sourcePath) => !mainSourceFiles.has(sourcePath)
            : undefined,
        }),
      );
      // Only include if it actually has content
      if (subRefDoc.namespaces.length > 0) {
        subExports.set(exportPath, {
          path: exportPath,
          ...subRefDoc,
        });
      }
      for (const diag of program.diagnostics ?? []) {
        diagnostics.add(diag);
      }
    } catch {
      // Skip sub-exports that fail to compile
    }
  }

  return subExports;
}

export interface ExtractRefDocOptions {
  namespaces?: {
    include?: string[];
    exclude?: string[];
  };
  /**
   * Filter to restrict which types are included based on their source file path.
   * When provided, only types declared in files for which this returns true will be included.
   */
  sourceFilter?: (sourcePath: string) => boolean;
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
      if (options.sourceFilter && namespace.node) {
        const loc = getSourceLocation(namespace.node);
        if (!loc.isSynthetic && !options.sourceFilter(loc.file.path)) {
          return;
        }
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

    function isIncludedBySourceFilter(type: Type): boolean {
      if (!options.sourceFilter) return true;
      const loc = getSourceLocation(type);
      if (loc.isSynthetic) return true;
      return options.sourceFilter(loc.file.path);
    }

    navigateTypesInNamespace(
      namespace,
      {
        decorator(dec) {
          if (hasInternalModifier(dec)) return;
          if (!isIncludedBySourceFilter(dec)) return;
          collectType(dec, extractDecoratorRefDoc(program, dec), namespaceDoc.decorators);
        },
        operation(operation) {
          if (hasInternalModifier(operation)) return;
          if (!isDeclaredType(operation)) {
            return;
          }
          if (!isIncludedBySourceFilter(operation)) return;

          if (operation.interface === undefined) {
            collectType(
              operation,
              extractOperationRefDoc(program, operation, undefined),
              namespaceDoc.operations,
            );
          }
        },
        interface(iface) {
          if (hasInternalModifier(iface)) return;
          if (!isDeclaredType(iface)) {
            return;
          }
          if (!isIncludedBySourceFilter(iface)) return;
          collectType(iface, extractInterfaceRefDocs(program, iface), namespaceDoc.interfaces);
        },
        model(model) {
          if (hasInternalModifier(model)) return;
          if (!isDeclaredType(model)) {
            return;
          }
          if (model.name === "") {
            return;
          }
          if (!isIncludedBySourceFilter(model)) return;
          collectType(model, extractModelRefDocs(program, model), namespaceDoc.models);
        },
        enum(e) {
          if (hasInternalModifier(e)) return;
          if (!isDeclaredType(e)) {
            return;
          }
          if (!isIncludedBySourceFilter(e)) return;
          collectType(e, extractEnumRefDoc(program, e), namespaceDoc.enums);
        },
        union(union) {
          if (hasInternalModifier(union)) return;
          if (!isDeclaredType(union)) {
            return;
          }
          if (union.name !== undefined) {
            if (!isIncludedBySourceFilter(union)) return;
            collectType(union, extractUnionRefDocs(program, union as any), namespaceDoc.unions);
          }
        },
        scalar(scalar) {
          if (hasInternalModifier(scalar)) return;
          if (!isIncludedBySourceFilter(scalar)) return;
          collectType(scalar, extractScalarRefDocs(program, scalar), namespaceDoc.scalars);
        },
      },
      { includeTemplateDeclaration: true, skipSubNamespaces: true },
    );
  }

  // Remove namespaces that have no content after filtering
  const filteredNamespaces = namespaces.filter(
    (ns) =>
      ns.decorators.length > 0 ||
      ns.operations.length > 0 ||
      ns.interfaces.length > 0 ||
      ns.models.length > 0 ||
      ns.enums.length > 0 ||
      ns.unions.length > 0 ||
      ns.scalars.length > 0,
  );

  sort(filteredNamespaces);
  for (const namespace of filteredNamespaces) {
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
    namespaces: filteredNamespaces,
    getNamedTypeRefDoc: (type) => typeMapping.get(type),
  });
}

/** Check if a type's declaration has the `internal` modifier. */
function hasInternalModifier(type: Type): boolean {
  const node = type.node;
  if (node === undefined) return false;
  if (!("modifiers" in node)) return false;
  return node.modifiers.some((m: any) => m.kind === SyntaxKind.InternalKeyword);
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
    variants: new Map(
      [...type.variants.values()]
        .filter((v): v is UnionVariant & { name: string } => typeof v.name === "string")
        .map((v) => [v.name, extractUnionVariantRefDocs(program, v)]),
    ),
  };
}

function extractUnionVariantRefDocs(
  program: Program,
  type: UnionVariant & { name: string },
): UnionVariantRefDoc {
  const doc = extractMainDoc(program, type);
  return {
    ...extractBase(program, type),
    signature: getTypeSignature(type),
    type,
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
    return extractEmitterOptionInfo(name, value);
  });
}

function extractEmitterOptionInfo(name: string, prop: any): EmitterOptionRefDoc {
  // Handle oneOf: extract variants
  if (prop.oneOf) {
    return extractOneOfEmitterOption(name, prop);
  }

  const option: Mutable<EmitterOptionRefDoc> = {
    name,
    type: resolveEmitterOptionType(prop),
    doc: resolveDescription(prop.description),
  };

  if (prop.enum) {
    option.allowedValues = prop.enum.map((x: string | number) =>
      typeof x === "string" ? `"${x}"` : String(x),
    );
  } else if (prop.type === "array" && prop.items?.enum) {
    option.allowedValues = prop.items.enum.map((x: string | number) =>
      typeof x === "string" ? `"${x}"` : String(x),
    );
  }

  if (prop.default !== undefined) {
    option.default = JSON.stringify(prop.default);
  }

  if (prop.deprecated !== undefined) {
    option.deprecated = typeof prop.deprecated === "string" ? prop.deprecated : "";
  }
  if (prop.type === "object" && prop.properties) {
    option.nestedOptions = Object.entries(prop.properties).map(
      ([subName, subProp]: [string, any]) => extractEmitterOptionInfo(subName, subProp),
    );
  }

  return option;
}

function extractOneOfEmitterOption(name: string, prop: any): EmitterOptionRefDoc {
  const rawVariants: any[] = prop.oneOf;

  const variants: EmitterOptionVariantRefDoc[] = [];

  for (const variant of rawVariants) {
    const v: Mutable<EmitterOptionVariantRefDoc> = {
      type: resolveEmitterOptionType(variant),
    };

    if (variant.enum) {
      v.allowedValues = variant.enum.map((x: string | number) =>
        typeof x === "string" ? `"${x}"` : String(x),
      );
    }

    if (variant.default !== undefined) {
      v.default = JSON.stringify(variant.default);
    }

    if (variant.description) {
      v.doc = resolveDescription(variant.description);
    }

    if (variant.type === "object" && variant.properties) {
      v.nestedOptions = Object.entries(variant.properties).map(
        ([subName, subProp]: [string, any]) => extractEmitterOptionInfo(subName, subProp),
      );
    }

    variants.push(v);
  }

  const option: Mutable<EmitterOptionRefDoc> = {
    name,
    type: rawVariants.map((v: any) => resolveEmitterOptionType(v)).join(" | "),
    doc: resolveDescription(prop.description),
    variants,
  };

  if (prop.default !== undefined) {
    option.default = JSON.stringify(prop.default);
  }

  return option;
}

function resolveEmitterOptionType(prop: any): string {
  if (prop.oneOf) {
    return prop.oneOf.map((s: any) => resolveEmitterOptionType(s)).join(" | ");
  }

  if (prop.type === "array") {
    if (prop.items) {
      if (prop.items.enum) {
        const values = prop.items.enum
          .map((x: string | number) => (typeof x === "string" ? `"${x}"` : String(x)))
          .join(" | ");
        return `(${values})[]`;
      }
      const itemType = prop.items.type ?? "unknown";
      return `${itemType}[]`;
    }
    return "array";
  }

  if (prop.type === "object" && prop.properties) {
    const keys = Object.keys(prop.properties);
    return `object { ${keys.join(", ")} }`;
  }

  if (prop.enum) {
    return prop.enum
      .map((x: string | number) => (typeof x === "string" ? `"${x}"` : String(x)))
      .join(" | ");
  }

  return prop.type ?? "unknown";
}

function resolveDescription(description: string | string[] | undefined): string {
  if (description === undefined) return "";
  return Array.isArray(description) ? description.join("\n") : description;
}

function resolveDoc(doc: string | FileRef | undefined, libraryPath: string): string | undefined {
  if (doc === undefined) return undefined;
  if (typeof doc === "string") return doc;
  try {
    return readFileSync(joinPaths(libraryPath, doc.path), "utf-8");
  } catch {
    return undefined;
  }
}

function extractLinterRefDoc(
  libName: string,
  linter: LinterResolvedDefinition,
  libraryPath: string,
): LinterRefDoc {
  return {
    ruleSets: linter.ruleSets && extractLinterRuleSetsRefDoc(libName, linter.ruleSets),
    rules: linter.rules.map((rule) => extractLinterRuleRefDoc(libName, rule, libraryPath)),
  };
}

function extractDiagnosticsRefDoc(
  libName: string,
  diagnostics: Record<string, DiagnosticDefinition<any>>,
  libraryPath: string,
): DiagnosticRefDoc[] {
  return Object.entries(diagnostics).map(([name, def]) => ({
    id: `${libName}/${name}`,
    name,
    severity: def.severity,
    doc: resolveDoc(def.docs, libraryPath),
  }));
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
  libraryPath: string,
): LinterRuleRefDoc {
  const fullName = `${libName}/${rule.name}`;
  return {
    kind: "rule",
    id: fullName,
    name: fullName,
    rule,
    doc: resolveDoc(rule.docs, libraryPath),
  };
}

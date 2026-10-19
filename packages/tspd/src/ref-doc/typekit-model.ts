import { joinPaths, type PackageJson } from "@typespec/compiler";
import {
  Application,
  OptionDefaults,
  ReflectionKind,
  TypeScript as ts,
  type Comment,
  type CommentDisplayPart,
  type DeclarationReflection,
  type ParameterReflection,
  type ProjectReflection,
  type SignatureReflection,
  type SomeType,
} from "typedoc";

export interface TypekitCollection {
  namespaces: Record<string, TypekitNamespace>;
}

export interface TypekitNamespace {
  kind: "namespace";
  name: string;
  typeName: string;
  doc?: string;
  entries: Record<string, TypekitNamespace | TypekitFunctionDoc>;
}

export interface TypekitFunctionDoc {
  kind: "getter" | "method" | "diagnosable";
  name: string;
  path: string[];
  parameters: TsFunctionParameter[];
  typeParameters: string[];
  docComment?: string;
  returnType: string;
}

export interface TsFunctionParameter {
  name: string;
  optional: boolean;
  rest: boolean;
  type: string;
}

export async function createTypekitCollection(
  libraryPath: string,
  pkgJson: PackageJson,
): Promise<TypekitCollection | undefined> {
  const exports = Object.keys(pkgJson.exports ?? {}).filter((name) =>
    name.split("/").includes("typekit"),
  );
  if (exports.length === 0) return undefined;

  const app = await Application.bootstrapWithPlugins({
    tsconfig: joinPaths(libraryPath, "tsconfig.build.json"),
    blockTags: [...OptionDefaults.blockTags, "@typekit"],
    disableSources: true,
  });
  // Scope TypeDoc's export discovery to the library rather than the caller's cwd.
  app.options.packageDir = libraryPath;
  const inferred = app.getEntryPoints();
  const entryPoints = exports.map((name) => {
    const entry = inferred?.find((entry) => entry.displayName === name.slice(2));
    if (!entry) {
      throw new Error(`TypeDoc could not resolve ${pkgJson.name}${name.slice(1)}.`);
    }
    return entry.sourceFile.fileName;
  });
  app.options.setValue("entryPoints", [...new Set(entryPoints)]);
  const sources = new Map<SignatureReflection, ts.SignatureDeclaration>();
  app.converter.on("createSignature", (_context, reflection, node) => {
    if (node && !ts.isJSDocSignature(node)) sources.set(reflection, node);
  });
  const project = await app.convert();
  if (!project || app.logger.hasErrors()) {
    throw new Error(`TypeDoc failed to analyze typekits in ${pkgJson.name}.`);
  }
  return extractTypekitCollection(project, sources, pkgJson.name);
}

function extractTypekitCollection(
  project: ProjectReflection,
  sources: ReadonlyMap<SignatureReflection, ts.SignatureDeclaration>,
  packageName?: string,
): TypekitCollection {
  const namespaces: Record<string, TypekitNamespace> = {};
  const interfaces = project
    .getReflectionsByKind(ReflectionKind.Interface)
    .filter((reflection): reflection is DeclarationReflection => reflection.isDeclaration())
    .sort((a, b) => a.name.localeCompare(b.name));
  for (const iface of interfaces) {
    if (packageName && project.getSymbolIdFromReflection(iface)?.packageName !== packageName) {
      continue;
    }
    const tag = iface.comment?.getTag("@typekit");
    if (!tag) continue;
    const name = renderDisplayParts(tag.content).trim();
    if (!name) throw new Error(`Missing @typekit name on ${iface.name}.`);
    if (namespaces[name]) throw new Error(`Duplicate @typekit name: ${name}.`);
    namespaces[name] = resolveTypekit(iface, [name], new Set(), sources);
  }
  return { namespaces };
}

function resolveTypekit(
  iface: DeclarationReflection,
  path: string[],
  parents: Set<DeclarationReflection>,
  sources: ReadonlyMap<SignatureReflection, ts.SignatureDeclaration>,
): TypekitNamespace {
  if (parents.has(iface)) throw new Error(`Circular typekit reference at ${path.join(".")}.`);
  const ancestors = new Set(parents).add(iface);
  const entries: TypekitNamespace["entries"] = {};
  for (const member of [...(iface.children ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
    const signature =
      member.getSignature ??
      member.signatures?.at(-1) ??
      (member.type?.type === "reflection" ? member.type.declaration.signatures?.at(-1) : undefined);
    if (signature) {
      entries[member.name] = createFunction(
        member,
        signature,
        path,
        member.getSignature ? "getter" : "method",
        sources,
      );
    } else if (member.type?.type === "reflection") {
      const subkit = resolveTypekit(
        member.type.declaration,
        [...path, member.name],
        ancestors,
        sources,
      );
      subkit.doc ??= member.comment ? renderDisplayParts(member.comment.summary) : undefined;
      entries[member.name] = subkit;
    } else if (member.type?.type === "reference") {
      const type = member.type;
      if (type.reflection?.isDeclaration() && type.reflection.kindOf(ReflectionKind.Interface)) {
        entries[member.name] = resolveTypekit(
          type.reflection,
          [...path, member.name],
          ancestors,
          sources,
        );
      } else if (type.name === "Diagnosable") {
        const functionType = type.typeArguments?.[0];
        const signature =
          functionType?.type === "reflection"
            ? functionType.declaration.signatures?.[0]
            : undefined;
        if (!signature) {
          throw new Error(
            `Cannot resolve Diagnosable signature for ${path.join(".")}.${member.name}.`,
          );
        }
        entries[member.name] = createFunction(member, signature, path, "diagnosable", sources);
      } else {
        throw new Error(`Expected a subkit at ${path.join(".")}.${member.name}, got ${type}.`);
      }
    } else {
      throw new Error(`Unsupported typekit member ${path.join(".")}.${member.name}.`);
    }
  }
  return {
    kind: "namespace",
    name: path.at(-1)!,
    typeName: iface.name,
    doc: iface.comment ? renderDisplayParts(iface.comment.summary) : undefined,
    entries,
  };
}

function createFunction(
  member: DeclarationReflection,
  signature: SignatureReflection,
  path: string[],
  kind: TypekitFunctionDoc["kind"],
  sources: ReadonlyMap<SignatureReflection, ts.SignatureDeclaration>,
): TypekitFunctionDoc {
  const source = sources.get(signature);
  const printer = ts.createPrinter({ removeComments: true });
  const print = (node: ts.Node) =>
    printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
  return {
    kind,
    name: member.name,
    path: [...path, member.name],
    parameters: (signature.parameters ?? []).map((parameter) => {
      const node = source?.parameters.find(
        (node) => ts.isIdentifier(node.name) && node.name.text === parameter.name,
      );
      return {
        name: parameter.name,
        optional: parameter.flags.isOptional,
        rest: parameter.flags.isRest,
        type: node?.type ? print(node.type) : renderType(parameter.type),
      };
    }),
    typeParameters: source?.typeParameters?.map(print) ?? [],
    docComment: renderComment(
      kind === "diagnosable"
        ? (member.comment ?? signature.comment)
        : (signature.comment ?? member.comment),
      signature.parameters ?? [],
    ),
    returnType: source?.type ? print(source.type) : renderType(signature.type),
  };
}

function renderType(type: SomeType | undefined): string {
  if (!type) throw new Error("Missing type in a typekit signature.");
  return type.toString();
}

function renderDisplayParts(parts: readonly CommentDisplayPart[]): string {
  return parts
    .map((part) => {
      if (part.kind !== "inline-tag") return part.text;
      let target = typeof part.target === "string" ? part.target : undefined;
      if (part.target && typeof part.target === "object" && "parent" in part.target) {
        const names = [part.target.name];
        for (
          let parent = part.target.parent;
          parent && !parent.kindOf(ReflectionKind.Project | ReflectionKind.Module);
          parent = parent.parent
        ) {
          names.unshift(parent.name);
        }
        target = names.join(".");
      }
      const content = target
        ? `${target}${part.text && part.text !== target ? ` | ${part.text}` : ""}`
        : part.text;
      return `{${part.tag} ${content}}`;
    })
    .join("");
}

function renderComment(
  comment: Comment | undefined,
  parameters: readonly ParameterReflection[],
): string | undefined {
  const sections = [comment ? renderDisplayParts(comment.summary).trim() : ""];
  const parameterDocs: string[] = [];
  for (const parameter of parameters) {
    if (parameter.comment) {
      parameterDocs.push(
        `@param ${parameter.name} - ${renderDisplayParts(parameter.comment.summary).trim()}`,
      );
    }
  }
  if (parameterDocs.length) sections.push(parameterDocs.join("\n"));
  for (const tag of comment?.blockTags ?? []) {
    const content = renderDisplayParts(tag.content);
    const separator = tag.tag === "@param" ? " - " : content.startsWith("```") ? "\n" : " ";
    sections.push(`${tag.tag}${tag.name ? ` ${tag.name}` : ""}${separator}${content}`.trim());
  }
  for (const tag of comment?.modifierTags ?? []) sections.push(tag);
  const content = sections.filter(Boolean).join("\n\n");
  if (!content) return undefined;
  return `/**\n${content
    .split("\n")
    .map((line) => (line ? ` * ${line}` : " *"))
    .join("\n")}\n */`;
}

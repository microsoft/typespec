import { joinPaths, type PackageJson } from "@typespec/compiler";
import {
  Application,
  type Comment,
  type CommentDisplayPart,
  type DeclarationReflection,
  ReflectionKind,
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
  /** Rendered summary of the typekit interface. */
  doc?: string;
  entries: Record<string, TypekitEntryDoc>;
}

export type TypekitEntryDoc = TypekitNamespace | TypekitFunctionDoc;

export interface TypekitFunctionDoc {
  kind: "getter" | "method" | "diagnosable";
  /**
   * Name of the function(Last part of the path)
   * @example For `$(program).foo.bar.baz()` the name is `baz`
   */
  name: string;
  /**
   * Full typekit path under $
   * @example For `$(program).foo.bar.baz()` the path is `["foo", "bar", "baz"]`
   */
  path: string[];
  /**
   * Parameters of the function. Undefined for getters.
   */
  parameters?: TsFunctionParameter[];
  /**
   * Rendered tsdoc comment block (`/** ... *&#47;`).
   */
  tsdoc?: string;
  /**
   * Rendered return type of the function/getter.
   */
  returnType: string;
}

export interface TsFunctionParameter {
  name: string;
  optional: boolean;
  type: string;
}

/**
 * Build the typekit model for the given library using TypeDoc.
 */
export async function createTypekitCollection(
  libraryPath: string,
  pkgJson: PackageJson,
): Promise<TypekitCollection | undefined> {
  const entrypoint = resolveTypekitSourceEntrypoint(libraryPath, pkgJson);
  if (!entrypoint) {
    return undefined;
  }

  const app = await Application.bootstrapWithPlugins({
    entryPoints: [entrypoint],
    tsconfig: joinPaths(libraryPath, "tsconfig.build.json"),
    entryPointStrategy: "resolve",
    excludeExternals: false,
  });

  // Register the custom `@typekit` block tag so TypeDoc captures it.
  const blockTags = app.options.getValue("blockTags") as `@${string}`[];
  if (!blockTags.includes("@typekit")) {
    app.options.setValue("blockTags", [...blockTags, "@typekit"]);
  }

  const project = await app.convert();
  if (!project) {
    return undefined;
  }

  const namespaces: Record<string, TypekitNamespace> = {};
  const entries: [string, DeclarationReflection][] = [];
  for (const iface of project.getReflectionsByKind(ReflectionKind.Interface)) {
    const decl = iface as DeclarationReflection;
    const typekitTag = decl.comment?.blockTags.find((x) => x.tag === "@typekit");
    if (typekitTag) {
      const name = renderDisplayParts(typekitTag.content).trim();
      entries.push([name, decl]);
    }
  }
  // Kits are declared across many files via module augmentation, so reflection
  // discovery order is not stable. Sort alphabetically for deterministic output.
  entries.sort(([a], [b]) => a.localeCompare(b));
  for (const [name, decl] of entries) {
    namespaces[name] = resolveTypekit(decl, [name]);
  }

  return { namespaces };
}

function resolveTypekit(iface: DeclarationReflection, path: string[]): TypekitNamespace {
  const typekit: TypekitNamespace = {
    kind: "namespace",
    name: path[0],
    typeName: iface.name,
    doc: iface.comment
      ? toParagraphs(renderDisplayParts(iface.comment.summary)).join("\n\n")
      : undefined,
    entries: {},
  };

  for (const member of [...(iface.children ?? [])].sort(byName)) {
    if (member.kindOf(ReflectionKind.Accessor) && member.getSignature) {
      // `get foo(): T` accessor.
      typekit.entries[member.name] = {
        kind: "getter",
        name: member.name,
        tsdoc: renderTsdoc(member.getSignature.comment ?? member.comment),
        path: [...path, member.name],
        parameters: [],
        returnType: typeToString(member.getSignature.type),
      };
    } else if (member.kindOf(ReflectionKind.Method) && member.signatures?.length) {
      // Mirror the previous behavior where the last overload wins.
      const signature = member.signatures[member.signatures.length - 1];
      typekit.entries[member.name] = createMethodDoc(member, signature, path);
    } else if (member.kindOf(ReflectionKind.Property)) {
      const type = member.type;
      if (type?.type === "reference" && type.reflection?.kindOf(ReflectionKind.Interface)) {
        // Property referencing another kit interface -> nested typekit.
        typekit.entries[member.name] = resolveTypekit(type.reflection as DeclarationReflection, [
          ...path,
          member.name,
        ]);
      } else if (type?.type === "reference" && type.name === "Diagnosable") {
        typekit.entries[member.name] = createDiagnosableDoc(member, type, path);
      } else if (type?.type === "reference") {
        throw new Error(
          `All typekit properties should be sub kits but got a reference to ${type.name} for ${path.join(".")}.${member.name}.`,
        );
      }
      // Properties with inline/anonymous types (e.g. function-typed helpers) are skipped,
      // matching the previous api-extractor based behavior.
    }
  }

  return typekit;
}

function createMethodDoc(
  member: DeclarationReflection,
  signature: SignatureReflection,
  path: string[],
): TypekitFunctionDoc {
  const parameters = signature.parameters ?? [];
  return {
    kind: "method",
    name: member.name,
    tsdoc: renderTsdoc(
      signature.comment ?? member.comment,
      parameters.map((param) => ({ name: param.name, comment: param.comment })),
    ),
    path: [...path, member.name],
    parameters: parameters.map((param) => ({
      name: param.name,
      optional: param.flags.isOptional,
      type: typeToString(param.type),
    })),
    returnType: typeToString(signature.type),
  };
}

function createDiagnosableDoc(
  member: DeclarationReflection,
  type: Extract<SomeType, { type: "reference" }>,
  path: string[],
): TypekitFunctionDoc {
  const fnSignature = getDiagnosableFunctionSignature(type);
  return {
    kind: "diagnosable",
    name: member.name,
    tsdoc: renderTsdoc(member.comment),
    path: [...path, member.name],
    parameters: fnSignature
      ? (fnSignature.parameters ?? []).map((param) => ({
          name: param.name,
          optional: param.flags.isOptional,
          type: typeToString(param.type),
        }))
      : [],
    returnType: fnSignature ? typeToString(fnSignature.type) : "unknown",
  };
}

/**
 * A `Diagnosable<T>` wraps a function type `T`. Extract that function signature.
 */
function getDiagnosableFunctionSignature(
  type: Extract<SomeType, { type: "reference" }>,
): SignatureReflection | undefined {
  const arg = type.typeArguments?.[0];
  if (arg?.type === "reflection") {
    return arg.declaration.signatures?.[0];
  }
  return undefined;
}

function typeToString(type: SomeType | undefined): string {
  return type ? type.toString() : "unknown";
}

function byName(a: DeclarationReflection, b: DeclarationReflection): number {
  return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

/**
 * Resolve the source `.ts` entrypoint for the first `typekit` package export.
 */
function resolveTypekitSourceEntrypoint(
  libraryPath: string,
  pkgJson: PackageJson,
): string | undefined {
  const exports = pkgJson.exports;
  if (!exports) {
    return undefined;
  }
  const typekitExport = Object.keys(exports).find((x) => x.includes("typekit"));
  if (!typekitExport) {
    return undefined;
  }
  const typesPath = resolveTypesPath((exports as Record<string, unknown>)[typekitExport]);
  if (!typesPath) {
    return undefined;
  }
  // e.g. ./dist/src/typekit/index.d.ts -> ./src/typekit/index.ts
  const sourceRelative = typesPath.replace(/^\.\/dist\//, "./").replace(/\.d\.ts$/, ".ts");
  return joinPaths(libraryPath, sourceRelative);
}

function resolveTypesPath(entry: unknown): string | undefined {
  if (typeof entry === "string") {
    return entry.replace(/\.js$/, ".d.ts");
  }
  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    if (typeof obj.types === "string") {
      return obj.types;
    }
    for (const condition of ["import", "default"]) {
      const resolved = resolveTypesPath(obj[condition]);
      if (resolved) {
        return resolved;
      }
    }
  }
  return undefined;
}

function renderDisplayParts(parts: readonly CommentDisplayPart[]): string {
  return parts
    .map((part) => {
      if (part.kind === "inline-tag" && part.tag === "@link") {
        return `{@link ${part.text}}`;
      }
      return part.text;
    })
    .join("");
}

/**
 * Collapse soft line breaks so each paragraph is a single line (matching the
 * previous api-extractor tsdoc rendering). Paragraphs are separated by blank lines.
 */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n[ \t]*\n/)
    .map((paragraph) =>
      paragraph
        .replace(/\s*\n\s*/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Render a TypeDoc comment into a tsdoc `/** ... *&#47;` block string.
 *
 * TypeDoc moves `@param` descriptions onto each parameter reflection, so for
 * function signatures the parameters must be passed in to reconstruct them.
 */
export function renderTsdoc(
  comment: Comment | undefined,
  params: readonly { name: string; comment?: Comment }[] = [],
): string | undefined {
  const blocks: string[][] = [];

  if (comment) {
    for (const paragraph of toParagraphs(renderDisplayParts(comment.summary))) {
      blocks.push([paragraph]);
    }
  }

  for (const param of params) {
    const description = param.comment ? renderDisplayParts(param.comment.summary) : "";
    const paragraphs = toParagraphs(description);
    if (paragraphs.length > 0) {
      blocks.push([`@param ${param.name} - ${paragraphs.join(" ")}`]);
    }
  }

  for (const tag of comment?.blockTags ?? []) {
    const paragraphs = toParagraphs(renderDisplayParts(tag.content).replace(/^-\s*/, ""));
    switch (tag.tag) {
      case "@param":
        if (paragraphs.length === 0) break;
        blocks.push([`@param ${tag.name ?? ""} - ${paragraphs.join(" ")}`]);
        break;
      case "@returns":
        if (paragraphs.length === 0) break;
        blocks.push([`@returns ${paragraphs[0] ?? ""}`]);
        for (const extra of paragraphs.slice(1)) {
          blocks.push([extra]);
        }
        break;
      case "@remarks":
        if (paragraphs.length === 0) break;
        blocks.push(["@remarks"]);
        for (const paragraph of paragraphs) {
          blocks.push([paragraph]);
        }
        break;
      default:
        if (paragraphs.length === 0) break;
        blocks.push([`${tag.tag} ${paragraphs[0] ?? ""}`.trimEnd()]);
        for (const extra of paragraphs.slice(1)) {
          blocks.push([extra]);
        }
        break;
    }
  }

  if (blocks.length === 0) {
    return undefined;
  }
  const lines = blocks.flatMap((block, index) => (index === 0 ? block : ["", ...block]));
  const body = lines.map((line) => (line ? ` * ${line}` : " *")).join("\n");
  return `/**\n${body}\n */`;
}

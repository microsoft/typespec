import {
  ApiDocumentedItem,
  ApiInterface,
  ApiMethodSignature,
  ApiProperty,
  ApiPropertySignature,
  Excerpt,
} from "@microsoft/api-extractor-model";
import { DocNode, type DocComment, type DocSection } from "@microsoft/tsdoc";
import { joinPaths, PackageJson } from "@typespec/compiler";
import { readdir, readFile, writeFile } from "fs/promises";
import { createApiModel } from "./api-extractor.js";
import { createTypekitDocs } from "./components/typekits-file.js";
import { readPackageJson } from "./utils/misc.js";

export interface TypekitCollection {
  namespaces: Record<string, TypekitNamespace>;
  isExperimental?: boolean;
  usageDoc?: string;
}

export interface TypekitNamespace {
  name: string;
  typeName: string;
  doc?: DocSection;
  entries: Record<string, TypekitEntryDoc>;
  isExperimental?: boolean;
  usageDoc?: string;
}

type TypekitEntryDoc = TypekitNamespace | TypekitFunctionDoc;

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
   * Doc comment
   */
  docComment?: DocComment;
  /**
   * The excerpt of the function
   */
  excerpt: Excerpt;

  /**
   * The excerpt of the return type
   */
  returnTypeExcerpt: Excerpt;
}

export interface TsFunctionParameter {
  name: string;
  doc: string;
  optional: boolean;
  typeExcerpt: Excerpt;
}

export async function writeTypekitDocs(libraryPath: string, outputDir: string): Promise<void> {
  const pkgJson = await readPackageJson(libraryPath);

  const typekits = await getTypekitApi(libraryPath, pkgJson);
  if (!typekits) {
    return;
  }
  const output = await createTypekitDocs(typekits);
  for (const [file, content] of Object.entries(output)) {
    await writeFile(joinPaths(outputDir, file), content);
  }
}

async function extractUsageDocFromLibrary(libraryPath: string): Promise<string | undefined> {
  // Look for typekit files in the library and extract @usageDoc
  async function searchDirectory(dir: string): Promise<string | undefined> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = joinPaths(dir, entry.name);
        if (entry.isDirectory()) {
          const result = await searchDirectory(fullPath);
          if (result) return result;
        } else if (entry.isFile() && entry.name.endsWith(".ts")) {
          const content = await readFile(fullPath, "utf-8");
          const usageMatch = content.match(
            /@usageDoc\s+([\s\S]*?)(?:\n\s*\*\s*@(?:experimental|typekit)|\n\s*\*\/)/,
          );
          if (usageMatch) {
            return usageMatch[1]
              .split("\n")
              .map((line) => line.replace(/^\s*\*\s?/, ""))
              .join("\n")
              .trim();
          }
        }
      }
    } catch (error) {
      // Ignore errors (e.g., directory doesn't exist)
    }
    return undefined;
  }

  // Search in src/typekit and src/experimental/typekit directories
  const typekitDir = joinPaths(libraryPath, "src", "typekit");
  let result = await searchDirectory(typekitDir);
  if (!result) {
    const experimentalTypekitDir = joinPaths(libraryPath, "src", "experimental", "typekit");
    result = await searchDirectory(experimentalTypekitDir);
  }
  return result;
}

async function getTypekitApi(
  libraryPath: string,
  pkgJson: PackageJson,
): Promise<TypekitCollection | undefined> {
  const api = await createApiModel(libraryPath, pkgJson);
  if (!api) {
    return undefined;
  }
  const namespaces: Record<string, TypekitNamespace> = {};
  let hasExperimental = false;

  // Extract usage documentation from the library source files once
  const collectionUsageDoc = await extractUsageDocFromLibrary(libraryPath);

  for (const pkgMember of api.packages[0].members) {
    for (const member of pkgMember.members) {
      if (member instanceof ApiInterface) {
        const docComment: DocComment | undefined = (member as ApiDocumentedItem).tsdocComment;
        const typekitTag = docComment?.customBlocks.find((x) => x.blockTag.tagName === "@typekit");
        if (typekitTag) {
          const name = (typekitTag.content.nodes[0] as any).nodes.filter(
            (x: DocNode) => x.kind === "PlainText",
          )[0].text;
          const isExperimental = docComment?.modifierTagSet.hasTagName("@experimental") ?? false;
          if (isExperimental) {
            hasExperimental = true;
          }

          // Usage doc is extracted once for the entire collection from source files
          const typekit: TypekitNamespace = resolveTypekit(
            member,
            [name],
            isExperimental,
            collectionUsageDoc,
          );
          namespaces[name] = typekit;
        }
      }
    }
  }

  function resolveTypekit(
    iface: ApiInterface,
    path: string[],
    isExperimental: boolean,
    usageDoc?: string,
  ): TypekitNamespace {
    const typekit: TypekitNamespace = {
      name: path[0],
      typeName: iface.displayName,
      doc: iface.tsdocComment?.summarySection,
      entries: {},
      isExperimental,
      usageDoc,
    };
    for (const member of iface.members) {
      if (member instanceof ApiPropertySignature) {
        const propertyReference = member.propertyTypeExcerpt.spannedTokens[0].canonicalReference;
        if (propertyReference) {
          const subkit = api!.resolveDeclarationReference(propertyReference, member);
          if (subkit.resolvedApiItem instanceof ApiInterface) {
            typekit.entries[member.displayName] = resolveTypekit(
              subkit.resolvedApiItem as ApiInterface,
              [...path, member.displayName],
              isExperimental,
              undefined, // Sub-kits don't have their own usage docs
            );
          } else if (propertyReference.toString() === "@typespec/compiler!Diagnosable:type") {
            typekit.entries[member.displayName] = {
              kind: "diagnosable",
              name: member.displayName,
              docComment: member.tsdocComment,
              path: [...path, member.displayName],
              excerpt: member.propertyTypeExcerpt,
              returnTypeExcerpt: member.propertyTypeExcerpt,
            };
          } else {
            throw new Error(
              `All typekits properties should be sub kits but got a ${subkit.resolvedApiItem?.kind} for ${path.join(".")}.${member.displayName}: ${subkit.errorMessage}`,
            );
          }
        }
      } else if (member instanceof ApiMethodSignature) {
        typekit.entries[member.displayName] = {
          kind: "method",
          name: member.displayName,
          docComment: member.tsdocComment,
          path: [...path, member.displayName],
          parameters: member.parameters.map((param) => ({
            doc: "TODO doc",
            name: param.name,
            optional: param.isOptional,
            typeExcerpt: param.parameterTypeExcerpt,
          })),
          excerpt: member.excerpt,
          returnTypeExcerpt: member.returnTypeExcerpt,
        };
      } else if (member instanceof ApiProperty) {
        typekit.entries[member.displayName] = {
          kind: "getter",
          name: member.displayName,
          docComment: member.tsdocComment,
          path: [...path, member.displayName],
          parameters: [],
          excerpt: member.excerpt,
          returnTypeExcerpt: member.propertyTypeExcerpt,
        };
      } else {
        // eslint-disable-next-line no-console
        console.warn(`Unknown member: ${member.displayName} of kind ${member.kind}`);
      }
    }
    return typekit;
  }

  return {
    namespaces,
    isExperimental: hasExperimental,
    usageDoc: collectionUsageDoc,
  };
}

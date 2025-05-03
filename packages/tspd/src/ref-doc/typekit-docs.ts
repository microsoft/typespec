import {
  ApiDocumentedItem,
  ApiInterface,
  ApiMethodSignature,
  ApiPropertySignature,
  Excerpt,
} from "@microsoft/api-extractor-model";
import { DocNode, type DocComment, type DocSection } from "@microsoft/tsdoc";
import { joinPaths, PackageJson } from "@typespec/compiler";
import { writeFile } from "fs/promises";
import { createApiModel } from "./api-extractor.js";
import { createTypekitDocs } from "./components/typekits-file.js";

export interface TypekitApi {
  typeName: string;
  doc?: DocSection;
  entries: Record<string, TypekitEntryDoc>;
}

type TypekitEntryDoc = TypekitApi | TypekitFunctionDoc;

export interface TypekitFunctionDoc {
  name: string;
  path: string[];
  parameters?: TsFunctionParameter[];
  docComment?: DocComment;
  excerpt: Excerpt;
}

export interface TsFunctionParameter {
  name: string;
  type: string;
  doc: string;
}

export async function writeTypekitDocs(
  libraryPath: string,
  pkgJson: PackageJson,
  outputDir: string,
): Promise<void> {
  const typekits = await getTypekitApi(libraryPath, pkgJson);
  if (!typekits) {
    return;
  }
  const output = await createTypekitDocs(typekits);
  for (const [file, content] of Object.entries(output)) {
    await writeFile(joinPaths(outputDir, file), content);
  }
}

async function getTypekitApi(
  libraryPath: string,
  pkgJson: PackageJson,
): Promise<TypekitApi | undefined> {
  const api = await createApiModel(libraryPath, pkgJson);
  if (!api) {
    return undefined;
  }
  const typekits: TypekitApi[] = [];
  for (const pkgMember of api.packages[0].members) {
    for (const member of pkgMember.members) {
      if (member instanceof ApiInterface) {
        const docComment: DocComment | undefined = (member as ApiDocumentedItem).tsdocComment;
        const typekitTag = docComment?.customBlocks.find((x) => x.blockTag.tagName === "@typekit");
        if (typekitTag) {
          const name = (typekitTag.content.nodes[0] as any).nodes.filter(
            (x: DocNode) => x.kind === "PlainText",
          )[0].text;
          const typekit: TypekitApi = resolveTypekit(member, [name]);
          typekits.push({
            typeName: member.displayName,
            doc: member.tsdocComment?.summarySection,
            entries: {
              [name]: typekit,
            },
          });
        }
      }
    }
  }

  function resolveTypekit(iface: ApiInterface, path: string[] = []): TypekitApi {
    const typekit: TypekitApi = {
      typeName: iface.displayName,
      doc: iface.tsdocComment?.summarySection,
      entries: {},
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
            );
          } else if (propertyReference.toString() === "@typespec/compiler!Diagnosable:type") {
            typekit.entries[member.displayName] = {
              name: member.displayName,
              docComment: member.tsdocComment,
              path: [...path, member.displayName],
              excerpt: member.excerpt,
            };
          } else {
            throw new Error(
              `All typekits properties should be sub kits but got a ${subkit.resolvedApiItem?.kind} for ${path.join(".")}.${member.displayName}: ${subkit.errorMessage}`,
            );
          }
        }
      } else if (member instanceof ApiMethodSignature) {
        typekit.entries[member.displayName] = {
          name: member.displayName,
          docComment: member.tsdocComment,
          path: [...path, member.displayName],
          parameters: member.parameters.map((param) => ({
            type: "TODO",
            doc: "TODO doc",
            name: param.name,
          })),
          excerpt: member.excerpt,
        };
      } else {
        throw new Error(`Unknown member: ${member.displayName} of kind ${member.kind}`);
      }
    }
    return typekit;
  }

  return {
    typeName: "TODO",
    entries: Object.fromEntries(typekits.flatMap((kit) => Object.entries(kit.entries))),
  };
}

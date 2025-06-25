import {
  getSourceLocation,
  getTypeName,
  type CodeFix,
  type Program,
  type SourceLocation,
  type Type,
  type TypeNameOptions,
} from "@typespec/compiler";
import type { Version } from "./types.js";
import { getAllVersions } from "./versioning.js";

export function getVersionAdditionCodefixes(
  version: string | Version,
  type: Type,
  program: Program,
  typeOptions?: TypeNameOptions,
): CodeFix[] | undefined {
  if (typeof version === "string") {
    return getVersionAdditionCodeFixFromString(version, type, program, typeOptions);
  }

  return getVersionAdditionCodeFixFromVersion(version, type, typeOptions);
}

function getVersionAdditionCodeFixFromVersion(
  version: Version,
  type: Type,
  typeOptions?: TypeNameOptions,
): CodeFix[] | undefined {
  if (type.node === undefined) return undefined;

  const enumMember = version.enumMember;
  const decoratorDeclaration = `@added(${enumMember.enum.name}.${enumMember.name})`;
  return [
    getDecorationAdditionCodeFix(
      "add-version-to-type",
      decoratorDeclaration,
      getTypeName(type, typeOptions),
      getSourceLocation(type.node),
    ),
  ];
}

function getVersionAdditionCodeFixFromString(
  version: string,
  type: Type,
  program: Program,
  typeOptions?: TypeNameOptions,
): CodeFix[] | undefined {
  const targetVersion = getAllVersions(program, type)?.find((v) => v.value === version);
  if (targetVersion === undefined) return undefined;

  return getVersionAdditionCodeFixFromVersion(targetVersion, type, typeOptions);
}

export function getVersionRemovalCodeFixes(
  version: string,
  type: Type,
  program: Program,
  typeOptions?: TypeNameOptions,
): CodeFix[] | undefined {
  if (type.node === undefined) return undefined;

  const targetVersion = getAllVersions(program, type)?.find((v) => v.value === version);
  if (targetVersion === undefined) return;

  const enumMember = targetVersion.enumMember;
  const decoratorDeclaration = `@removed(${enumMember.enum.name}.${enumMember.name})`;
  return [
    getDecorationAdditionCodeFix(
      "remove-version-from-type",
      decoratorDeclaration,
      getTypeName(type, typeOptions),
      getSourceLocation(type.node),
    ),
  ];
}

function getDecorationAdditionCodeFix(
  id: string,
  decoratorDeclaration: string,
  typeName: string,
  location: SourceLocation,
): CodeFix {
  return {
    id: id,
    label: `Add '${decoratorDeclaration}' to '${typeName}'`,
    fix: (context) => {
      return context.prependText(location, `${decoratorDeclaration}\n`);
    },
  };
}

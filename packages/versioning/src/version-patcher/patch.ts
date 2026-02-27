import {
  applyCodeFixes,
  defineCodeFix,
  getSourceLocation,
  isType,
  listServices,
  navigateProgram,
  type CodeFix,
  type DecoratorApplication,
  type Node,
  type Program,
  type SourceLocation,
  type Type,
} from "@typespec/compiler";
import type { VersionMap } from "../decorators.js";
import type { Version } from "../types.js";
import { getVersions } from "../versioning.js";

interface DecoratorUsage {
  type: Type;
  decorator: DecoratorApplication;
}

function findVersioningDecorators(
  program: Program,
  versionToRemove: Version,
  versions: VersionMap,
): DecoratorUsage[] {
  const decoratorsToUpdate: DecoratorUsage[] = [];

  // List of versioning decorators to check
  const versioningDecorators = [
    `@added`,
    `@removed`,
    `@renamedFrom`,
    `@madeOptional`,
    `@madeRequired`,
    `@typeChangedFrom`,
    `@returnTypeChangedFrom`,
  ];

  navigateProgram(program, {
    model(model) {
      checkTypeDecorators(model);
    },
    modelProperty(property) {
      checkTypeDecorators(property);
    },
    operation(operation) {
      checkTypeDecorators(operation);
    },
    enum(enumType) {
      checkTypeDecorators(enumType);
      // enumMember callback is not called by navigateProgram, so we need to check members manually
      for (const member of enumType.members.values()) {
        checkTypeDecorators(member);
      }
    },
    union(union) {
      checkTypeDecorators(union);
    },
    unionVariant(variant) {
      checkTypeDecorators(variant);
    },
    scalar(scalar) {
      checkTypeDecorators(scalar);
    },
    interface(iface) {
      checkTypeDecorators(iface);
    },
  });

  function checkTypeDecorators(type: Type) {
    if (!("decorators" in type)) return;

    for (const decorator of type.decorators) {
      const decoratorName = decorator.definition?.name;

      // Check if this is a versioning decorator
      if (!decoratorName || !versioningDecorators.includes(decoratorName)) {
        continue;
      }

      // Check if the first argument is an EnumMember matching our version to remove
      const firstArg = decorator.args[0];
      if (firstArg && isType(firstArg.value) && firstArg.value.kind === "EnumMember") {
        const enumMember = firstArg.value;
        const version = versions.getVersionForEnumMember(enumMember);
        if (version && version.index === versionToRemove.index) {
          decoratorsToUpdate.push({ type, decorator });
        }
      }
    }
  }

  return decoratorsToUpdate;
}

/**
 * Check if a type has a @removed decorator with the specified version
 */
function hasRemovedDecorator(type: Type, version: Version, versions: VersionMap): boolean {
  if (!("decorators" in type)) return false;

  for (const decorator of type.decorators) {
    if (decorator.definition?.name !== "@removed") continue;

    const firstArg = decorator.args[0];
    if (firstArg && isType(firstArg.value) && firstArg.value.kind === "EnumMember") {
      const removedVersion = versions.getVersionForEnumMember(firstArg.value);
      if (removedVersion && removedVersion.index === version.index) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find a @added decorator with the specified version on a type
 */
function findAddedDecorator(
  type: Type,
  version: Version,
  versions: VersionMap,
): DecoratorApplication | undefined {
  if (!("decorators" in type)) return undefined;

  for (const decorator of type.decorators) {
    if (decorator.definition?.name !== "@added") continue;

    const firstArg = decorator.args[0];
    if (firstArg && isType(firstArg.value) && firstArg.value.kind === "EnumMember") {
      const addedVersion = versions.getVersionForEnumMember(firstArg.value);
      if (addedVersion && addedVersion.index === version.index) {
        return decorator;
      }
    }
  }
  return undefined;
}

/**
 * Get the removal location for a type that includes the trailing/leading separator for list members.
 * For model properties, enum members, and union variants, this extends the removal range to include
 * the separator (semicolon, comma) to avoid leaving orphaned punctuation.
 */
function getRemovalLocation(type: Type): SourceLocation | undefined {
  if (!("node" in type) || !type.node) return undefined;

  const node = type.node as Node;
  const location = getSourceLocation(node);
  if (!location) return undefined;

  // Get sibling nodes based on the type's kind
  let siblingNodes: readonly Node[] | undefined;

  if (type.kind === "ModelProperty" && "model" in type && type.model?.node) {
    const modelNode = type.model.node as { properties?: readonly Node[] };
    siblingNodes = modelNode.properties;
  } else if (type.kind === "EnumMember" && "enum" in type && type.enum?.node) {
    const enumNode = type.enum.node as { members?: readonly Node[] };
    siblingNodes = enumNode.members;
  } else if (type.kind === "UnionVariant" && "union" in type && type.union?.node) {
    const unionNode = type.union.node as { options?: readonly Node[] };
    siblingNodes = unionNode.options;
  }

  if (!siblingNodes || siblingNodes.length === 0) return location;

  const index = siblingNodes.findIndex((s) => s === node);
  if (index === -1) return location;

  // Extend the removal range to include the separator
  if (index < siblingNodes.length - 1) {
    // Not the last item: extend to the start of the next item
    return {
      file: location.file,
      pos: location.pos,
      end: siblingNodes[index + 1].pos,
    };
  } else if (index > 0) {
    // Last item: extend from the end of the previous item
    return {
      file: location.file,
      pos: siblingNodes[index - 1].end,
      end: location.end,
    };
  }

  return location;
}

function createCodeFixesForDecorators(
  decoratorsToUpdate: DecoratorUsage[],
  versionToRemove: Version,
  versions: VersionMap,
): CodeFix[] {
  const allVersions = versions.getVersions();
  const nextVersion = allVersions.find((v) => v.index === versionToRemove.index + 1);

  if (!nextVersion) {
    // No next version available, cannot create fix
    return [];
  }

  const codeFixes: CodeFix[] = [];
  const typesToRemove = new Set<Type>();
  const decoratorsToRemove: DecoratorApplication[] = [];

  for (const { type, decorator } of decoratorsToUpdate) {
    if (!decorator.node || decorator.args.length === 0) {
      continue;
    }

    const firstArg = decorator.node.arguments[0];
    if (!firstArg) continue;

    const decoratorName = decorator.definition?.name || "decorator";

    // Special case: if this is @added and there's also @removed(nextVersion),
    // the type should be removed entirely instead of updating the version
    if (decoratorName === "@added" && hasRemovedDecorator(type, nextVersion, versions)) {
      typesToRemove.add(type);
      continue;
    }

    // Special case: if this is @removed and there's also @added(nextVersion),
    // both decorators should be dropped (but the type remains)
    if (decoratorName === "@removed") {
      const addedDecorator = findAddedDecorator(type, nextVersion, versions);
      if (addedDecorator) {
        decoratorsToRemove.push(decorator);
        decoratorsToRemove.push(addedDecorator);
        continue;
      }
    }

    const newVersionRef = `${nextVersion.enumMember.enum.name}.${nextVersion.enumMember.name}`;

    codeFixes.push(
      defineCodeFix({
        id: `replace-version-${decoratorName}`,
        label: `Replace ${versionToRemove.name} with ${nextVersion.name} in ${decoratorName}`,
        fix: (context) => {
          const location = getSourceLocation(firstArg);
          return context.replaceText(location, newVersionRef);
        },
      }),
    );
  }

  // Create code fixes to remove types that were added and removed in the same version
  for (const type of typesToRemove) {
    const location = getRemovalLocation(type);
    if (!location) continue;

    codeFixes.push(
      defineCodeFix({
        id: `remove-type-added-and-removed`,
        label: `Remove type that is added and removed in ${nextVersion.name}`,
        fix: (context) => {
          return context.replaceText(location, "");
        },
      }),
    );
  }

  // Create code fixes to remove decorators where @removed and @added cancel each other out
  for (const decorator of decoratorsToRemove) {
    if (!decorator.node) continue;

    const location = getSourceLocation(decorator.node);
    if (!location) continue;

    codeFixes.push(
      defineCodeFix({
        id: `remove-decorator-cancelled`,
        label: `Remove decorator that is cancelled out`,
        fix: (context) => {
          return context.replaceText(location, "");
        },
      }),
    );
  }

  return codeFixes;
}

export function getVersionRemovalCodeFixes(program: Program, versionName: string) {
  const services = listServices(program);
  if (services.length > 1) {
    throw new Error("Version patching only supports specs with a single service");
  } else if (services.length === 0) {
    throw new Error("No services found in the spec");
  }

  const [_, versions] = getVersions(program, services[0].type);
  const versionToRemove = versions
    ?.getVersions()
    .find((x) => x.name === versionName || x.value === versionName);

  if (versionToRemove === undefined) {
    throw new Error(
      `Version ${versionName} not found in the spec. Versions found: ${versions
        ?.getVersions()
        .map((v) => v.name)
        .join(", ")}`,
    );
  }

  const decoratorsToUpdate = findVersioningDecorators(program, versionToRemove, versions!);
  return createCodeFixesForDecorators(decoratorsToUpdate, versionToRemove, versions!);
}

export async function removeVersionFromSpec(program: Program, versionName: string): Promise<void> {
  const codeFixes = getVersionRemovalCodeFixes(program, versionName);
  await applyCodeFixes(program.host, codeFixes);
}

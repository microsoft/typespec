import {
  applyCodeFixes,
  defineCodeFix,
  getSourceLocation,
  isType,
  listServices,
  navigateProgram,
  type CodeFix,
  type DecoratorApplication,
  type Program,
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
    },
    enumMember(enumMember) {
      checkTypeDecorators(enumMember);
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

  for (const { type, decorator } of decoratorsToUpdate) {
    if (!decorator.node || decorator.args.length === 0) {
      continue;
    }

    const firstArg = decorator.node.arguments[0];
    if (!firstArg) continue;

    const newVersionRef = `${nextVersion.enumMember.enum.name}.${nextVersion.enumMember.name}`;
    const decoratorName = decorator.definition?.name || "decorator";

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

  return codeFixes;
}

export function getVersionRemovalCodeFixes(program: Program, versionName: string) {
  const results: Record<string, string> = {};
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

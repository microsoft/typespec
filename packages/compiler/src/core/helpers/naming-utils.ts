import { getFriendlyName } from "../../lib/decorators.js";
import { createDiagnostic } from "../messages.js";
import { Program } from "../program.js";
import { Diagnostic, Entity, TemplatedType, Type } from "../types.js";
import { getEntityName } from "./type-name-utils.js";

/**
 * Capitalize the first letter of a string.
 */
function capitalize<S extends string>(str: S): Capitalize<S> {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<S>;
}

/**
 * Resolve a name for a Template Instance in a PascalCase format joined by the template arguments names.
 */
export function resolveTemplateInstanceName(
  program: Program,
  type: TemplatedType
): [string | undefined, readonly Diagnostic[]] {
  const friendlyName = getFriendlyName(program, type);

  if (friendlyName) {
    return [capitalize(friendlyName), []];
  }

  const diagnostics: Diagnostic[] = [];
  const templateArguments = type.templateMapper?.args ?? [];
  let prefix = "";
  for (const arg of templateArguments) {
    const name = getTemplateArgumentName(program, arg);
    if (name) {
      prefix += name;
    } else {
      diagnostics.push(
        createDiagnostic({
          code: "template-instance-unnameable",
          format: {
            templateName: type.name ?? "",
            arg: getEntityName(arg),
          },
          target: type,
        })
      );
    }
  }

  if (diagnostics.length > 0) {
    return [undefined, diagnostics];
  }
  return [`${prefix}${type.name}`, []];
}

function getTemplateArgumentName(program: Program, arg: Entity): string | undefined {
  if (arg.entityKind === "Type") {
    return getNameForType(program, arg);
  }
  return undefined;
}

function getNameForType(program: Program, type: Type): string | undefined {
  if ("name" in type && typeof type.name === "string" && type.name !== "") {
    if ("templateMapper" in type && type.templateMapper) {
      return resolveTemplateInstanceName(program, type)[0];
    } else {
      return capitalize(type.name);
    }
  }
  return undefined;
}

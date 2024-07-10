import { getFriendlyName } from "../../lib/decorators.js";
import { Program } from "../program.js";
import { TemplatedType } from "../types.js";

export interface TemplateInstanceNameOptions {
  readonly ignoreFriendlyName?: string;
}

/**
 * Capitalize the first letter of a string.
 */
function capitalize<S extends string>(str: S): Capitalize<S> {
  return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<S>;
}

/**
 * Resolve a name for a Template Instance.
 */
export function resolveTemplateInstanceName(
  program: Program,
  type: TemplatedType,
  options?: TemplateInstanceNameOptions
): string | undefined {
  const friendlyName = options?.ignoreFriendlyName ? undefined : getFriendlyName(program, type);

  if (friendlyName) {
    return capitalize(friendlyName);
  }

  const templateArguments = type.templateMapper?.args ?? [];
  const prefix = templateArguments
    .map((arg) => {
      if ("name" in arg && typeof arg.name === "string" && arg.name !== "")
        return capitalize(arg.name!);
      return "";
    })
    .join("");

  return `${prefix}${type.name}`;
}

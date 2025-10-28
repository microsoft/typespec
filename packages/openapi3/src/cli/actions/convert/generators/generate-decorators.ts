import { TSValue, TypeSpecDecorator } from "../interfaces.js";
import { stringLiteral } from "./common.js";

function generateDecorator({ name, args }: TypeSpecDecorator): string {
  const hasArgs = args.length;
  const stringifiedArguments = hasArgs
    ? `(${args
        .map((a) => {
          if (isTSValue(a)) {
            return a.value;
          } else if (typeof a === "string") {
            // Use stringLiteral to properly escape strings including ${...}
            return stringLiteral(a);
          } else {
            return JSON.stringify(a);
          }
        })
        .join(", ")})`
    : "";

  return `@${name}${stringifiedArguments}`;
}

export function generateDecorators(
  decorators: TypeSpecDecorator[],
  namesToExclude: string[] = [],
): string[] {
  const uniqueDecorators = new Set<string>(
    decorators.filter((d) => !namesToExclude.includes(d.name)).map(generateDecorator),
  );
  return Array.from(uniqueDecorators);
}

function isTSValue(value: unknown): value is TSValue {
  return Boolean(
    value && typeof value === "object" && "__kind" in value && value["__kind"] === "value",
  );
}

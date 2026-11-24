import type { TSValue, TypeSpecDecorator, TypeSpecDirective } from "../interfaces.js";
import { stringLiteral } from "./common.js";

function generateDirective({ name, message }: TypeSpecDirective): string {
  return `#${name} ${stringLiteral(message)}`;
}

export function generateDirectives(directives: TypeSpecDirective[] = []): string[] {
  return directives.map(generateDirective);
}

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
  const seen = new Set<string>();
  return decorators
    .filter((d) => !namesToExclude.includes(d.name))
    .flatMap((decorator) => {
      const generated = generateDecorator(decorator);
      if (decorator.name !== "example" && seen.has(generated)) {
        return [];
      }
      seen.add(generated);
      return [generated];
    });
}

function isTSValue(value: unknown): value is TSValue {
  return Boolean(
    value && typeof value === "object" && "__kind" in value && value["__kind"] === "value",
  );
}

import { TypeSpecDecorator } from "../interfaces.js";

function generateDecorator({ name, args }: TypeSpecDecorator): string {
  const hasArgs = args.length;
  const stringifiedArguments = hasArgs ? `(${args.map((a) => JSON.stringify(a)).join(", ")})` : "";

  return `@${name}${stringifiedArguments}`;
}

export function generateDecorators(decorators: TypeSpecDecorator[]): string[] {
  const uniqueDecorators = new Set<string>(decorators.map(generateDecorator));
  return Array.from(uniqueDecorators);
}

import { TSValue, TypeSpecDecorator } from "../interfaces.js";

function generateDecorator({ name, args }: TypeSpecDecorator): string {
  const hasArgs = args.length;
  const stringifiedArguments = hasArgs
    ? `(${args.map((a) => (isTSValue(a) ? a.value : JSON.stringify(a))).join(", ")})`
    : "";

  return `@${name}${stringifiedArguments}`;
}

export function generateDecorators(decorators: TypeSpecDecorator[]): string[] {
  const uniqueDecorators = new Set<string>(decorators.map(generateDecorator));
  return Array.from(uniqueDecorators);
}

function isTSValue(value: unknown): value is TSValue {
  return Boolean(
    value && typeof value === "object" && "__kind" in value && value["__kind"] === "value",
  );
}

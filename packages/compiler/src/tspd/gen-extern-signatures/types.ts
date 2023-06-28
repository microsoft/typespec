import type { Decorator } from "../../core/types.js";

export interface DecoratorSignature {
  /** Decorator name ()`@example `@foo`) */
  name: string;

  /** Name of the js function. (@example `$foo`) */
  jsName: string;

  /** TypeScript type name (@example `FooDecorator`) */
  typeName: string;

  decorator: Decorator;
}

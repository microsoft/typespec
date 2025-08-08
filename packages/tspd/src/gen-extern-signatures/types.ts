import type { Decorator, FunctionType } from "../../../compiler/src/core/types.js";

export type EntitySignature = DecoratorSignature | FunctionSignature;

export interface DecoratorSignature {
  kind: Decorator["kind"];

  /** Decorator name ()`@example `@foo`) */
  name: string;

  /** Name of the js function. (@example `$foo`) */
  jsName: string;

  /** TypeScript type name (@example `FooDecorator`) */
  typeName: string;

  decorator: Decorator;
}

export interface FunctionSignature {
  kind: FunctionType["kind"];

  /** Function name */
  name: string;

  /** TypeScript type name (@example `FooFunction`) */
  typeName: string;

  tspFunction: FunctionType;
}

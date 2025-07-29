import type {
  DecoratorContext,
  Enum,
  EnumMember,
  Interface,
  Model,
  ModelProperty,
  Namespace,
  Union,
  UnionVariant,
} from "@typespec/compiler";

export interface ClientDecoratorOptions {
  readonly name?: string;
  readonly emitterScope?: string;
}

export interface ClientNameOptions {
  readonly emitterScope?: string;
}

/**
 * Create a TypeSpec.HttpClient.Client client out of a namespace or interface
 *
 * @example
 * ```typespec
 * @client
 * namespace MyService {}
 * ```
 * @example
 * ```typespec
 * @client
 * interface MyService {}
 * ```
 */
export type ClientDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface,
  options?: ClientDecoratorOptions,
) => void;

export type ClientNameDecorator = (
  context: DecoratorContext,
  target: Namespace | Interface | Model | ModelProperty | Enum | EnumMember | Union | UnionVariant,
  name: string,
  options?: ClientNameOptions,
) => void;

export type TypeSpecHttpClientDecorators = {
  client: ClientDecorator;
  clientName: ClientNameDecorator;
};

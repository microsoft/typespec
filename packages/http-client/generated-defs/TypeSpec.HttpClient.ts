import type { DecoratorContext, Interface, Namespace, Operation } from "@typespec/compiler";

export interface ClientDecoratorOptions {
  readonly name?: string;
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

export type ClientLocationDecorator = (
  context: DecoratorContext,
  source: Operation,
  target: Namespace | Interface,
) => void;

export type TypeSpecHttpClientDecorators = {
  client: ClientDecorator;
  clientLocation: ClientLocationDecorator;
};

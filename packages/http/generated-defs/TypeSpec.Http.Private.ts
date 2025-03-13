import type { DecoratorContext, Model, Type } from "@typespec/compiler";

export interface HttpPartOptions {
  readonly name?: string;
}

export type PlainDataDecorator = (context: DecoratorContext, target: Model) => void;

export type HttpFileDecorator = (context: DecoratorContext, target: Model) => void;

export type HttpPartDecorator = (
  context: DecoratorContext,
  target: Model,
  type: Type,
  options: HttpPartOptions,
) => void;

/**
 * Specify if inapplicable metadata should be included in the payload for the given entity.
 *
 * @param value If true, inapplicable metadata will be included in the payload.
 */
export type IncludeInapplicableMetadataInPayloadDecorator = (
  context: DecoratorContext,
  target: Type,
  value: boolean,
) => void;

export type TypeSpecHttpPrivateDecorators = {
  plainData: PlainDataDecorator;
  httpFile: HttpFileDecorator;
  httpPart: HttpPartDecorator;
  includeInapplicableMetadataInPayload: IncludeInapplicableMetadataInPayloadDecorator;
};

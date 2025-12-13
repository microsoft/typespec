import type { DecoratorContext, Model, Type } from "@typespec/compiler";

export type SerializeAsTextDecorator = (
  context: DecoratorContext,
  target: Model,
  type: Type,
) => void;

export type TypeSpecMCPPrivateDecorators = {
  serializeAsText: SerializeAsTextDecorator;
};

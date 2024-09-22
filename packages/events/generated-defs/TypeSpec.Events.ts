import type {
  DecoratorContext,
  ModelProperty,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";

export type EventsDecorator = (context: DecoratorContext, target: Union) => void;

export type ContentTypeDecorator = (
  context: DecoratorContext,
  target: UnionVariant,
  contentType: Type
) => void;

export type DataDecorator = (context: DecoratorContext, target: ModelProperty) => void;

export type TypeSpecEventsDecorators = {
  events: EventsDecorator;
  contentType: ContentTypeDecorator;
  data: DataDecorator;
};

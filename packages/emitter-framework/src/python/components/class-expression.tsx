import { Model } from "@typespec/compiler";

export interface ClassExpressionModel {
  /** The Model type that corresponds to the class. */
  type?: Model;
  name?: string;
}

export function ClassExpression({ type, name }: ClassExpressionModel) {
  // TODO: Need to ensure the proper import for the class.
  return name ?? type?.name;
}

import type {
  BooleanLiteral,
  Enum,
  EnumMember,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  NumericLiteral,
  Operation,
  Scalar,
  StringLiteral,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import type { MutationEngine } from "../mutation/mutation-engine.js";
import { EnumMemberMutationNode } from "./enum-member.js";
import { EnumMutationNode } from "./enum.js";
import { InterfaceMutationNode } from "./interface.js";
import { IntrinsicMutationNode } from "./intrinsic.js";
import { LiteralMutationNode } from "./literal.js";
import { ModelPropertyMutationNode } from "./model-property.js";
import { ModelMutationNode } from "./model.js";
import { OperationMutationNode } from "./operation.js";
import { ScalarMutationNode } from "./scalar.js";
import { TupleMutationNode } from "./tuple.js";
import { UnionVariantMutationNode } from "./union-variant.js";
import { UnionMutationNode } from "./union.js";

export function mutationNodeFor<T extends Type>(
  engine: MutationEngine<any>,
  sourceType: T,
  mutationKey?: string,
): MutationNodeForType<T> {
  switch (sourceType.kind) {
    case "Operation":
      return new OperationMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    case "Interface":
      return new InterfaceMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    case "Model":
      return new ModelMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    case "ModelProperty":
      return new ModelPropertyMutationNode(
        engine,
        sourceType,
        mutationKey,
      ) as MutationNodeForType<T>;
    case "Scalar":
      return new ScalarMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    case "Tuple":
      return new TupleMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    case "Union":
      return new UnionMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    case "UnionVariant":
      return new UnionVariantMutationNode(
        engine,
        sourceType,
        mutationKey,
      ) as MutationNodeForType<T>;
    case "Enum":
      return new EnumMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    case "EnumMember":
      return new EnumMemberMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    case "String":
    case "Number":
    case "Boolean":
      return new LiteralMutationNode(
        engine,
        sourceType as StringLiteral | NumericLiteral | BooleanLiteral,
        mutationKey,
      ) as MutationNodeForType<T>;
    case "Intrinsic":
      return new IntrinsicMutationNode(engine, sourceType, mutationKey) as MutationNodeForType<T>;
    default:
      throw new Error("Unsupported type kind: " + sourceType.kind);
  }
}

export type MutationNodeForType<T extends Type> = T extends Model
  ? ModelMutationNode
  : T extends Interface
    ? InterfaceMutationNode
    : T extends Operation
      ? OperationMutationNode
      : T extends ModelProperty
        ? ModelPropertyMutationNode
        : T extends Scalar
          ? ScalarMutationNode
          : T extends Tuple
            ? TupleMutationNode
            : T extends Union
              ? UnionMutationNode
              : T extends UnionVariant
                ? UnionVariantMutationNode
                : T extends Enum
                  ? EnumMutationNode
                  : T extends EnumMember
                    ? EnumMemberMutationNode
                    : T extends StringLiteral | NumericLiteral | BooleanLiteral
                      ? LiteralMutationNode
                      : T extends IntrinsicType
                        ? IntrinsicMutationNode
                        : never;

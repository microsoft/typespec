import type {
  BooleanLiteral,
  Interface,
  IntrinsicType,
  MemberType,
  Model,
  ModelProperty,
  NumericLiteral,
  Operation,
  Scalar,
  StringLiteral,
  Type,
  Union,
  UnionVariant,
} from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { type MutationNodeForType } from "../mutation-node/factory.js";
import type { InterfaceMutationNode } from "../mutation-node/interface.js";
import type { IntrinsicMutationNode } from "../mutation-node/intrinsic.js";
import type { LiteralMutationNode } from "../mutation-node/literal.js";
import type { ModelPropertyMutationNode } from "../mutation-node/model-property.js";
import type { ModelMutationNode } from "../mutation-node/model.js";
import type { HalfEdge } from "../mutation-node/mutation-edge.js";
import type { OperationMutationNode } from "../mutation-node/operation.js";
import type { ScalarMutationNode } from "../mutation-node/scalar.js";
import type { UnionVariantMutationNode } from "../mutation-node/union-variant.js";
import type { UnionMutationNode } from "../mutation-node/union.js";
import { InterfaceMutation } from "./interface.js";
import { IntrinsicMutation } from "./intrinsic.js";
import { LiteralMutation } from "./literal.js";
import { ModelPropertyMutation } from "./model-property.js";
import { ModelMutation } from "./model.js";
import {
  type ConstructorsFor,
  type CustomMutationClasses,
  MutationEngine,
  MutationHalfEdge,
  MutationOptions,
} from "./mutation-engine.js";
import type { MutationInfo } from "./mutation.js";
import { OperationMutation } from "./operation.js";
import { ScalarMutation } from "./scalar.js";
import { UnionVariantMutation } from "./union-variant.js";
import { UnionMutation } from "./union.js";

/** Strategy instance types that expose one mutation node for each supported kind. */
export interface SimpleMutations<TOptions extends SimpleMutationOptions> {
  /** Connects an operation to its parameter model and return type. */
  Operation: SimpleOperationMutation<TOptions>;
  /** Connects an interface to its operations. */
  Interface: SimpleInterfaceMutation<TOptions>;
  /** Connects a model to its base, properties, and indexer. */
  Model: SimpleModelMutation<TOptions>;
  /** Connects a scalar to its base scalar. */
  Scalar: SimpleScalarMutation<TOptions>;
  /** Connects a property to its resolved underlying type. */
  ModelProperty: SimpleModelPropertyMutation<TOptions>;
  /** Connects a union to its variants. */
  Union: SimpleUnionMutation<TOptions>;
  /** Connects a variant to its resolved underlying type. */
  UnionVariant: SimpleUnionVariantMutation<TOptions>;
  /** Exposes a node for a string literal without traversing children. */
  String: SimpleLiteralMutation<TOptions>;
  /** Exposes a node for a numeric literal without traversing children. */
  Number: SimpleLiteralMutation<TOptions>;
  /** Exposes a node for a boolean literal without traversing children. */
  Boolean: SimpleLiteralMutation<TOptions>;
  /** Exposes a node for a compiler intrinsic without traversing children. */
  Intrinsic: SimpleIntrinsicMutation<TOptions>;
}

/** Union of the single-node strategies listed in {@link SimpleMutations}. */
export type SimpleMutation = SimpleMutations<SimpleMutationOptions>[keyof SimpleMutations<any>];

/** Initialization shape accepted by {@link SimpleMutationOptions}. */
export interface SimpleMutationOptionsInit {
  /** Optional reference connection; currently not consumed by the options constructor. */
  referenceEdge?: HalfEdge<any, any>;
}

/** Default options for simple strategies; inherits the empty mutation cache key. */
export class SimpleMutationOptions extends MutationOptions {
  /** Creates default options. The initializer is currently accepted but not stored. */
  constructor(init?: SimpleMutationOptionsInit) {
    super();
  }
}

/**
 * Supplies single-node strategies for models, properties, operations, interfaces,
 * scalars, unions, variants, literals, and intrinsics.
 *
 * Traversal establishes graph connections without eagerly cloning source types.
 * Customize these strategies to mutate their nodes; omitted constructors use the
 * simple defaults where available and otherwise the base engine's defaults.
 */
export class SimpleMutationEngine<
  TCustomMutations extends CustomMutationClasses,
> extends MutationEngine<TCustomMutations> {
  /** Creates an engine using the given typekit and any custom strategy constructors. */
  constructor($: Typekit, mutatorClasses: ConstructorsFor<TCustomMutations>) {
    const defaultedMutatorClasses = {
      Operation: mutatorClasses.Operation ?? SimpleOperationMutation,
      Interface: mutatorClasses.Interface ?? SimpleInterfaceMutation,
      Model: mutatorClasses.Model ?? SimpleModelMutation,
      Scalar: mutatorClasses.Scalar ?? SimpleScalarMutation,
      ModelProperty: mutatorClasses.ModelProperty ?? SimpleModelPropertyMutation,
      Union: mutatorClasses.Union ?? SimpleUnionMutation,
      UnionVariant: mutatorClasses.UnionVariant ?? SimpleUnionVariantMutation,
      String: mutatorClasses.String ?? SimpleLiteralMutation,
      Number: mutatorClasses.Number ?? SimpleLiteralMutation,
      Boolean: mutatorClasses.Boolean ?? SimpleLiteralMutation,
      Intrinsic: mutatorClasses.Intrinsic ?? SimpleIntrinsicMutation,
    } as any;
    super($, defaultedMutatorClasses);
  }

  mutate<TType extends Type>(
    type: TType,
    options: MutationOptions = new SimpleMutationOptions(),
    halfEdge?: MutationHalfEdge,
  ) {
    return super.mutate(type, options, halfEdge);
  }

  mutateReference(
    reference: MemberType,
    options: MutationOptions = new SimpleMutationOptions(),
    halfEdge?: MutationHalfEdge,
  ) {
    return super.mutateReference(reference, options, halfEdge);
  }
}

/** Contract for a strategy exposing a single node in the parallel type graph. */
export interface SingleMutationNode<T extends Type> {
  /** Node tracking the source type, changes, and references from other nodes. */
  mutationNode: MutationNodeForType<T>;
  /** Current output type; identical to the source until the node needs to change. */
  mutatedType: T;
}

export class SimpleModelMutation<TOptions extends SimpleMutationOptions>
  extends ModelMutation<
    SimpleMutations<TOptions>,
    TOptions,
    SimpleMutationEngine<SimpleMutations<TOptions>>
  >
  implements SingleMutationNode<Model>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  startBaseEdge() {
    return this.#createHalfEdge("base", (tail) =>
      this.#mutationNode.connectBase(tail.mutationNode as ModelMutationNode),
    );
  }

  startPropertyEdge() {
    return new MutationHalfEdge(
      "property",
      this,
      (tail) => this.#mutationNode.connectProperty(tail.mutationNode as ModelPropertyMutationNode),
      "ModelProperty",
    );
  }

  startIndexerKeyEdge() {
    return this.#createHalfEdge("indexerKey", (tail) =>
      this.#mutationNode.connectIndexerKey(tail.mutationNode as ScalarMutationNode),
    );
  }

  startIndexerValueEdge() {
    return this.#createHalfEdge("indexerValue", (tail) =>
      this.#mutationNode.connectIndexerValue(tail.mutationNode as MutationNodeForType<Type>),
    );
  }

  #createHalfEdge(
    kind: string,
    cb: (tail: SimpleMutation) => void,
  ): MutationHalfEdge<SimpleModelMutation<any>, SimpleMutation> {
    return new MutationHalfEdge(kind, this, cb);
  }

  #mutationNode: ModelMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

export class SimpleModelPropertyMutation<TOptions extends SimpleMutationOptions>
  extends ModelPropertyMutation<
    SimpleMutations<TOptions>,
    TOptions,
    SimpleMutationEngine<SimpleMutations<TOptions>>
  >
  implements SingleMutationNode<ModelProperty>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: ModelProperty,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  startTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge("type", this, (tail) => {
      this.#mutationNode.connectType(tail.mutationNode as MutationNodeForType<Type>);
    });
  }

  #mutationNode: ModelPropertyMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

export class SimpleUnionMutation<TOptions extends SimpleMutationOptions>
  extends UnionMutation<
    TOptions,
    SimpleMutations<TOptions>,
    SimpleMutationEngine<SimpleMutations<TOptions>>
  >
  implements SingleMutationNode<Union>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: Union,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  protected startVariantEdge(): MutationHalfEdge {
    return new MutationHalfEdge(
      "variant",
      this,
      (tail) => {
        this.#mutationNode.connectVariant(tail.mutationNode as UnionVariantMutationNode);
      },
      "UnionVariant",
    );
  }

  #mutationNode: UnionMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

export class SimpleUnionVariantMutation<TOptions extends SimpleMutationOptions>
  extends UnionVariantMutation<
    TOptions,
    SimpleMutations<TOptions>,
    SimpleMutationEngine<SimpleMutations<TOptions>>
  >
  implements SingleMutationNode<UnionVariant>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: UnionVariant,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  protected startTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge("type", this, (tail) => {
      this.#mutationNode.connectType(tail.mutationNode as MutationNodeForType<Type>);
    });
  }

  #mutationNode: UnionVariantMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

export class SimpleOperationMutation<TOptions extends SimpleMutationOptions>
  extends OperationMutation<
    TOptions,
    SimpleMutations<TOptions>,
    SimpleMutationEngine<SimpleMutations<TOptions>>
  >
  implements SingleMutationNode<Operation>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: Operation,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  protected startParametersEdge(): MutationHalfEdge {
    return new MutationHalfEdge("parameters", this, (tail) => {
      this.#mutationNode.connectParameters(tail.mutationNode as ModelMutationNode);
    });
  }

  protected startReturnTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge("returnType", this, (tail) => {
      this.#mutationNode.connectReturnType(tail.mutationNode as MutationNodeForType<Type>);
    });
  }

  #mutationNode: OperationMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

export class SimpleInterfaceMutation<TOptions extends SimpleMutationOptions>
  extends InterfaceMutation<TOptions, SimpleMutations<TOptions>>
  implements SingleMutationNode<Interface>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: Interface,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  protected startOperationEdge(): MutationHalfEdge {
    return new MutationHalfEdge("operation", this, (tail) => {
      this.#mutationNode.connectOperation(tail.mutationNode as OperationMutationNode);
    });
  }

  #mutationNode: InterfaceMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

export class SimpleScalarMutation<TOptions extends SimpleMutationOptions>
  extends ScalarMutation<
    TOptions,
    SimpleMutations<TOptions>,
    SimpleMutationEngine<SimpleMutations<TOptions>>
  >
  implements SingleMutationNode<Scalar>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: Scalar,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  protected startBaseScalarEdge(): MutationHalfEdge {
    return new MutationHalfEdge("base", this, (tail) => {
      this.#mutationNode.connectBaseScalar(tail.mutationNode as ScalarMutationNode);
    });
  }

  #mutationNode: ScalarMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

export class SimpleLiteralMutation<TOptions extends SimpleMutationOptions>
  extends LiteralMutation<
    TOptions,
    SimpleMutations<TOptions>,
    SimpleMutationEngine<SimpleMutations<TOptions>>
  >
  implements SingleMutationNode<StringLiteral | NumericLiteral | BooleanLiteral>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: StringLiteral | NumericLiteral | BooleanLiteral,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  #mutationNode: LiteralMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

export class SimpleIntrinsicMutation<TOptions extends SimpleMutationOptions>
  extends IntrinsicMutation<
    TOptions,
    SimpleMutations<TOptions>,
    SimpleMutationEngine<SimpleMutations<TOptions>>
  >
  implements SingleMutationNode<IntrinsicType>
{
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<TOptions>>,
    sourceType: IntrinsicType,
    referenceTypes: MemberType[],
    options: TOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, {
      mutationKey: info.mutationKey,
      isSynthetic: info.isSynthetic,
    });
  }

  #mutationNode: IntrinsicMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

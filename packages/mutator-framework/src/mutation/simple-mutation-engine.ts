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

export interface SimpleMutations<TOptions extends SimpleMutationOptions> {
  Operation: SimpleOperationMutation<TOptions>;
  Interface: SimpleInterfaceMutation<TOptions>;
  Model: SimpleModelMutation<TOptions>;
  Scalar: SimpleScalarMutation<TOptions>;
  ModelProperty: SimpleModelPropertyMutation<TOptions>;
  Union: SimpleUnionMutation<TOptions>;
  UnionVariant: SimpleUnionVariantMutation<TOptions>;
  String: SimpleLiteralMutation<TOptions>;
  Number: SimpleLiteralMutation<TOptions>;
  Boolean: SimpleLiteralMutation<TOptions>;
  Intrinsic: SimpleIntrinsicMutation<TOptions>;
}

export type SimpleMutation = SimpleMutations<SimpleMutationOptions>[keyof SimpleMutations<any>];

export interface SimpleMutationOptionsInit {
  referenceEdge?: HalfEdge<any, any>;
}

export class SimpleMutationOptions extends MutationOptions {
  #referenceEdge: HalfEdge<any, any> | undefined;
  get referenceEdge() {
    return this.#referenceEdge;
  }

  constructor(init?: SimpleMutationOptionsInit) {
    super();
    this.#referenceEdge = init?.referenceEdge;
  }

  with(options: SimpleMutationOptionsInit) {
    return new SimpleMutationOptions({
      referenceEdge: options.referenceEdge ?? this.#referenceEdge,
    });
  }
}

export class SimpleMutationEngine<
  TCustomMutations extends CustomMutationClasses,
> extends MutationEngine<TCustomMutations> {
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

export interface SingleMutationNode<T extends Type> {
  mutationNode: MutationNodeForType<T>;
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
  }

  startBaseEdge() {
    return this.#createHalfEdge((tail) =>
      this.#mutationNode.connectBase(tail.mutationNode as ModelMutationNode),
    );
  }

  startPropertyEdge() {
    return this.#createHalfEdge((tail) =>
      this.#mutationNode.connectProperty(tail.mutationNode as ModelPropertyMutationNode),
    );
  }

  startIndexerKeyEdge() {
    return this.#createHalfEdge((tail) =>
      this.#mutationNode.connectIndexerKey(tail.mutationNode as ScalarMutationNode),
    );
  }

  startIndexerValueEdge() {
    return this.#createHalfEdge((tail) =>
      this.#mutationNode.connectIndexerValue(tail.mutationNode as MutationNodeForType<Type>),
    );
  }

  #createHalfEdge(
    cb: (tail: SimpleMutation) => void,
  ): MutationHalfEdge<SimpleModelMutation<any>, SimpleMutation> {
    return new MutationHalfEdge(this, cb);
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
  }

  startTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
  }

  protected startVariantEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#mutationNode.connectVariant(tail.mutationNode as UnionVariantMutationNode);
    });
  }

  mutate(newOptions: SimpleMutationOptions = this.options) {
    // Call the base mutateVariants but with custom options handling
    this.variants = new Map(
      [...this.sourceType.variants].map(([name, variant]) => [
        name,
        this.engine.mutate(
          variant,
          newOptions.with({ referenceEdge: this.#mutationNode.startVariantEdge() }),
        ),
      ]),
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
  }

  protected startTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#mutationNode.connectType(tail.mutationNode as MutationNodeForType<Type>);
    });
  }

  mutate(newOptions: SimpleMutationOptions = this.options) {
    this.type = this.engine.mutate(
      this.sourceType.type,
      newOptions.with({ referenceEdge: this.#mutationNode.startTypeEdge() }),
    );
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
  }

  protected startParametersEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#mutationNode.connectParameters(tail.mutationNode as ModelMutationNode);
    });
  }

  protected startReturnTypeEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#mutationNode.connectReturnType(tail.mutationNode as MutationNodeForType<Type>);
    });
  }

  mutate(newOptions: SimpleMutationOptions = this.options) {
    this.parameters = this.engine.mutate(
      this.sourceType.parameters,
      newOptions.with({ referenceEdge: this.#mutationNode.startParametersEdge() }),
    );
    this.returnType = this.engine.mutate(
      this.sourceType.returnType,
      newOptions.with({ referenceEdge: this.#mutationNode.startReturnTypeEdge() }),
    );
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
  }

  protected startOperationEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#mutationNode.connectOperation(tail.mutationNode as OperationMutationNode);
    });
  }

  mutate(newOptions: SimpleMutationOptions = this.options) {
    this.operations = new Map(
      [...this.sourceType.operations].map(([name, op]) => [
        name,
        this.engine.mutate(
          op,
          newOptions.with({ referenceEdge: this.#mutationNode.startOperationEdge() }),
        ),
      ]),
    );
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
  }

  protected startBaseScalarEdge(): MutationHalfEdge {
    return new MutationHalfEdge(this, (tail) => {
      this.#mutationNode.connectBaseScalar(tail.mutationNode as ScalarMutationNode);
    });
  }

  mutate(newOptions: SimpleMutationOptions = this.options) {
    if (this.sourceType.baseScalar) {
      this.baseScalar = this.engine.mutate(
        this.sourceType.baseScalar,
        newOptions.with({ referenceEdge: this.#mutationNode.startBaseScalarEdge() }),
      );
    }
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
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
    this.#mutationNode = this.engine.getMutationNode(this.sourceType, info.mutationKey);
    if (options.referenceEdge) {
      options.referenceEdge.setTail(this.#mutationNode);
    }
  }

  #mutationNode: IntrinsicMutationNode;
  get mutationNode() {
    return this.#mutationNode;
  }

  get mutatedType() {
    return this.#mutationNode.mutatedType;
  }
}

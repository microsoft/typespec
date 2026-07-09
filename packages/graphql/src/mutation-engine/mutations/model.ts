import {
  isArrayModelType,
  isTemplateInstance,
  isType,
  walkPropertiesInherited,
  type MemberType,
  type Model,
  type Program,
  type Type,
  type Value,
} from "@typespec/compiler";
import {
  SimpleModelMutation,
  type MutationInfo,
  type MutationOptions,
  type SimpleMutationEngine,
  type SimpleMutationOptions,
  type SimpleMutations,
} from "@typespec/mutator-framework";
import { isInterfaceOnly } from "../../lib/interface.js";
import { applyTypeNamePipeline } from "../../lib/naming.js";
import { composeTemplateName } from "../../lib/template-composition.js";
import { isRecordType } from "../../lib/type-utils.js";
import {
  hasNoVisibleProperties,
  isPropertyVisible,
  type VisibilityFilter,
} from "../../lib/visibility.js";
import { GraphQLMutationOptions, GraphQLTypeContext } from "../options.js";

/**
 * Maps decorator function names to the mutation context their type args
 * should be mutated with. When a model is cloned, decorator args that
 * reference types need re-mutation — but the context may differ from the
 * model's own context (e.g., @compose args are always interfaces regardless
 * of whether the model is mutated as Input or Output).
 *
 * Keyed by function name (not reference) because vitest can load the same
 * module from different paths, creating distinct function objects.
 */
const decoratorArgContext = new Map<string, GraphQLTypeContext>([
  ["$compose", GraphQLTypeContext.Interface],
]);

/**
 * GraphQL-specific Model mutation.
 */
export class GraphQLModelMutation extends SimpleModelMutation<SimpleMutationOptions> {
  constructor(
    engine: SimpleMutationEngine<SimpleMutations<SimpleMutationOptions>>,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    info: MutationInfo,
  ) {
    super(engine, sourceType, referenceTypes, options, info);
  }

  /**
   * The input/output context this model was mutated with, if any.
   * Undefined when the model was mutated directly (not through an operation).
   */
  get typeContext(): GraphQLTypeContext | undefined {
    return this.options instanceof GraphQLMutationOptions ? this.options.typeContext : undefined;
  }

  mutate() {
    const tk = this.engine.$;
    const program = tk.program;
    const isInputContext = this.typeContext === GraphQLTypeContext.Input;
    const isInterfaceContext = this.typeContext === GraphQLTypeContext.Interface;

    const rawName = isTemplateInstance(this.sourceType)
      ? composeTemplateName(this.sourceType)
      : this.sourceType.name;
    const visibilityFilter =
      this.options instanceof GraphQLMutationOptions ? this.options.visibilityFilter : undefined;
    const inputQualifier =
      this.options instanceof GraphQLMutationOptions ? this.options.inputQualifier : undefined;

    if (this.shouldReplaceWithScalar(program, visibilityFilter)) {
      // Record<T> scalars should NOT get Input suffix - they're opaque map types with
      // no structural difference between input/output. Visibility-filtered scalars
      // (where all properties were removed) keep the Input suffix to distinguish variants.
      const isPureRecord =
        isRecordType(this.sourceType) &&
        (walkPropertiesInherited(this.sourceType).next().done ?? false);
      const scalarName = applyTypeNamePipeline(rawName, {
        isInput: isInputContext && !isPureRecord,
        isInterface: false,
        inputQualifier: isPureRecord ? undefined : inputQualifier,
      });
      this.mutationNode.replace(
        program.checker.createType({
          kind: "Scalar",
          name: scalarName,
          decorators: [],
          derivedScalars: [],
          constructors: new Map(),
        }),
      );
      return;
    }

    const needsInterfaceSuffix = isInterfaceContext && !isInterfaceOnly(program, this.sourceType);

    this.mutationNode.mutate((model) => {
      model.name = applyTypeNamePipeline(rawName, {
        isInput: isInputContext,
        isInterface: needsInterfaceSuffix,
        inputQualifier,
      });
      if (isInputContext) {
        model.decorators = model.decorators.filter(
          (d) => !decoratorArgContext.has(d.decorator.name),
        );
      } else {
        this.mutateDecoratorTypeArgs(model);
      }
    });
    super.mutate();
    this.flattenBaseModel();
  }

  protected override mutateProperties(newOptions: MutationOptions = this.options) {
    const visibilityFilter =
      this.options instanceof GraphQLMutationOptions ? this.options.visibilityFilter : undefined;

    if (!visibilityFilter) {
      super.mutateProperties(newOptions);
      return;
    }

    const program = this.engine.$.program;

    for (const prop of this.sourceType.properties.values()) {
      if (!isPropertyVisible(program, prop, visibilityFilter)) {
        this.mutationNode.mutatedType.properties.delete(prop.name);
      }
    }
    for (const prop of this.sourceType.properties.values()) {
      if (isPropertyVisible(program, prop, visibilityFilter)) {
        this.properties.set(
          prop.name,
          this.engine.mutate(prop, newOptions, this.startPropertyEdge()),
        );
      }
    }
  }

  private flattenBaseModel() {
    if (!this.baseModel) return;
    const mutated = this.mutationNode.mutatedType;
    const baseProps = this.baseModel.mutatedType.properties;
    const ownEntries = [...mutated.properties.entries()];
    mutated.properties.clear();
    for (const [name, prop] of baseProps) {
      mutated.properties.set(name, prop);
    }
    for (const [name, prop] of ownEntries) {
      mutated.properties.set(name, prop);
    }
    mutated.baseModel = undefined;
  }

  private shouldReplaceWithScalar(
    program: Program,
    visibilityFilter: VisibilityFilter | undefined,
  ): boolean {
    if (!this.sourceType.name || isArrayModelType(this.sourceType)) return false;
    return this.willHaveNoFields(program, visibilityFilter);
  }

  private willHaveNoFields(
    program: Program,
    visibilityFilter: VisibilityFilter | undefined,
  ): boolean {
    // Record<T> with no own/inherited properties → opaque map scalar
    if (isRecordType(this.sourceType))
      return walkPropertiesInherited(this.sourceType).next().done ?? false;
    // Model declared with no properties at all
    if (this.sourceType.properties.size === 0) return true;
    // All properties removed by visibility filtering (e.g., all @visibility(Lifecycle.Read) in input context)
    if (visibilityFilter) return hasNoVisibleProperties(program, this.sourceType, visibilityFilter);
    return false;
  }

  private mutateDecoratorTypeArgs(model: Model) {
    for (let i = 0; i < model.decorators.length; i++) {
      const dec = model.decorators[i];
      const argContext = decoratorArgContext.get(dec.decorator.name);
      const options = argContext ? new GraphQLMutationOptions(argContext) : this.options;

      let argsChanged = false;
      const newArgs = dec.args.map((arg) => {
        if (this.isMutatableType(arg.value)) {
          const mutation = this.engine.mutate(arg.value, options) as { mutatedType: Type };
          argsChanged = true;
          return { ...arg, value: mutation.mutatedType, jsValue: mutation.mutatedType };
        }
        return arg;
      });

      if (argsChanged) {
        model.decorators[i] = { ...dec, args: newArgs };
      }
    }
  }

  private isMutatableType(value: Type | Value): value is Type {
    if (!isType(value)) return false;
    const kind = value.kind;
    return (
      kind === "Model" ||
      kind === "Union" ||
      kind === "Scalar" ||
      kind === "Enum" ||
      kind === "Interface" ||
      kind === "Operation"
    );
  }
}

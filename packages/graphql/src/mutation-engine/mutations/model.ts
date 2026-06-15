import {
  isTemplateInstance,
  isType,
  walkPropertiesInherited,
  type MemberType,
  type Model,
  type Type,
  type Value,
} from "@typespec/compiler";
import {
  type MutationOptions,
  SimpleModelMutation,
  type MutationInfo,
  type SimpleMutationEngine,
  type SimpleMutationOptions,
  type SimpleMutations,
} from "@typespec/mutator-framework";
import { isInterfaceOnly } from "../../lib/interface.js";
import { applyTypeNamePipeline } from "../../lib/naming.js";
import { composeTemplateName } from "../../lib/template-composition.js";
import { isRecordType } from "../../lib/type-utils.js";
import { isPropertyVisible } from "../../lib/visibility.js";
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

    if (isRecordType(this.sourceType) && walkPropertiesInherited(this.sourceType).next().done) {
      const rawName = isTemplateInstance(this.sourceType)
        ? composeTemplateName(this.sourceType)
        : this.sourceType.name;
      const scalarName = applyTypeNamePipeline(rawName, {
        isInput: isInputContext,
        isInterface: false,
      });
      const scalar = program.checker.createType({
        kind: "Scalar",
        name: scalarName,
        decorators: [],
        derivedScalars: [],
        constructors: new Map(),
      });
      this.mutationNode.replace(scalar);
      return;
    }

    const rawName = isTemplateInstance(this.sourceType)
      ? composeTemplateName(this.sourceType)
      : this.sourceType.name;

    const needsInterfaceSuffix =
      isInterfaceContext && !isInterfaceOnly(program, this.sourceType);

    const inputQualifier =
      this.options instanceof GraphQLMutationOptions ? this.options.inputQualifier : undefined;

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
    const visibilityFilter = this.options instanceof GraphQLMutationOptions
      ? this.options.visibilityFilter
      : undefined;

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

  private mutateDecoratorTypeArgs(model: Model) {
    for (let i = 0; i < model.decorators.length; i++) {
      const dec = model.decorators[i];
      const argContext = decoratorArgContext.get(dec.decorator.name);
      const options = argContext
        ? new GraphQLMutationOptions(argContext)
        : this.options;

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
    return kind === "Model" || kind === "Union" || kind === "Scalar" || kind === "Enum" || kind === "Interface" || kind === "Operation";
  }
}

import { ModelProperty, Operation, Type } from "../../../core/index.js";
import { $, defineKit } from "../define-kit.js";

interface OperationDescriptor {
  /**
   * The name of the model property.
   */
  name: string;

  /**
   * The parameters to the model
   */
  parameters: ModelProperty[];

  /**
   * The return type of the model
   */
  returnType: Type;
}

export interface OperationKit {
  /**
   * Create an operation type.
   *
   * @param desc The descriptor of the operation.
   */
  create(desc: OperationDescriptor): Operation;
}

interface TypeKit {
  /**
   * Utilities for working with operation properties.
   */
  operation: OperationKit;
}

declare module "../define-kit.js" {
  interface TypekitPrototype extends TypeKit {}
}

export const OperationKit = defineKit<TypeKit>({
  operation: {
    create(desc) {
      const parametersModel = $.model.create({
        name: `${desc.name}Parameters`,
        properties: desc.parameters.reduce(
          (acc, property) => {
            acc[property.name] = property;
            return acc;
          },
          {} as Record<string, ModelProperty>,
        ),
      });
      const operation: Operation = this.program.checker.createType({
        kind: "Operation",
        name: desc.name,
        decorators: [],
        parameters: parametersModel,
        returnType: desc.returnType,
        node: undefined as any,
      });
      this.program.checker.finishType(operation);
      return operation;
    },
  },
});

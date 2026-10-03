import type { BaseSchema, Extensions, Languages, ModelOptions, Schema } from "../model.js";
import { createSchema, initializeMetadata, SchemaType } from "../model.js";

/** a container for the actual constant value */
export interface ConstantValue extends Extensions {
  /** per-language information for this value */
  language?: Languages;
  /** the actual constant value to use */
  value: string | number | boolean;
}

export function createConstantValue(
  value: ConstantValue["value"],
  options?: Partial<ConstantValue>,
): ConstantValue {
  return { value, ...options };
}

/** a schema that represents a constant value */
export interface ConstantSchema<ConstantType extends Schema = Schema> extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Constant;
  /** the schema type of the constant value (ie, StringSchema, NumberSchema, etc) */
  valueType: ConstantType;

  /** the actual constant value */
  value: ConstantValue;
}

export function createConstantSchema(
  name: string,
  description: string,
  options: ModelOptions<ConstantSchema> & Pick<ConstantSchema, "valueType" | "value">,
): ConstantSchema {
  return initializeMetadata(
    {
      ...createSchema(name, description, SchemaType.Constant),
      valueType: options.valueType,
      value: options.value,
    },
    options,
  );
}

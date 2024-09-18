/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { Extensions, Languages, Schema, SchemaType } from "@autorest/codemodel";
import { DeepPartial, Initializer } from "@azure-tools/codegen";
import { SchemaUsage } from "./usage.js";

/** a container for the actual constant value */
export interface ConstantValue extends Extensions {
  /** per-language information for this value */
  language?: Languages;

  /** the actual constant value to use */
  value: any;
}

export class ConstantValue extends Initializer implements ConstantValue {
  constructor(value: any, objectInitializer?: DeepPartial<ConstantValue>) {
    super();
    this.value = value;
    this.apply(objectInitializer);
  }
}

/** a schema that represents a constant value */
export interface ConstantSchema<ConstantType extends Schema = Schema> extends Schema, SchemaUsage {
  /** the schema type  */
  type: SchemaType.Constant;

  /** the schema type of the constant value (ie, StringSchema, NumberSchema, etc) */
  valueType: ConstantType;

  /** the actual constant value */
  value: ConstantValue;
}

export class ConstantSchema<ConstantType extends Schema = Schema>
  extends Schema
  implements ConstantSchema<ConstantType>
{
  constructor(
    name: string,
    description: string,
    objectInitializer?: DeepPartial<ConstantSchema<ConstantType>>,
  ) {
    super(name, description, SchemaType.Constant);
    this.apply(objectInitializer);
  }
}

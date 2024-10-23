/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import {
  ChoiceValue,
  PrimitiveSchema,
  Schema,
  SchemaType,
  StringSchema,
  ValueSchema,
} from "@autorest/codemodel";
import { DeepPartial } from "@azure-tools/codegen";
import { SchemaUsage } from "./usage.js";

/** a schema that represents a choice of several values (ie, an 'enum') */
export interface ChoiceSchema<ChoiceType extends PrimitiveSchema = StringSchema>
  extends ValueSchema,
    SchemaUsage {
  /** the schema type  */
  type: SchemaType.Choice;
  /** the primitive type for the choices */
  choiceType: ChoiceType;
  /** the possible choices for in the set */
  choices: Array<ChoiceValue>;

  crossLanguageDefinitionId?: string;
}

export class ChoiceSchema<ChoiceType extends PrimitiveSchema = StringSchema>
  extends Schema
  implements ChoiceSchema<ChoiceType>
{
  constructor(
    name: string,
    description: string,
    objectInitializer?: DeepPartial<ChoiceSchema<ChoiceType>>,
  ) {
    super(name, description, SchemaType.Choice);
    this.apply(objectInitializer);
  }
}

/** a schema that represents a choice of several values (ie, an 'enum') */
export interface SealedChoiceSchema<ChoiceType extends PrimitiveSchema = StringSchema>
  extends ValueSchema,
    SchemaUsage {
  /** the schema type  */
  type: SchemaType.SealedChoice;

  /** the primitive type for the choices */
  choiceType: ChoiceType;

  /** the possible choices for in the set */
  choices: Array<ChoiceValue>;

  crossLanguageDefinitionId?: string;
}

export class SealedChoiceSchema<ChoiceType extends PrimitiveSchema = StringSchema>
  extends Schema
  implements SealedChoiceSchema<ChoiceType>
{
  // crossLanguageDefinitionId?: string;

  constructor(
    name: string,
    description: string,
    objectInitializer?: DeepPartial<ChoiceSchema<ChoiceType>>,
  ) {
    super(name, description, SchemaType.SealedChoice);
    this.apply(objectInitializer);
  }
}

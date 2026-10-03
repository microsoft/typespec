import type { BaseSchema, ChoiceValue, ModelOptions, PrimitiveSchema } from "../model.js";
import { createSchema, initializeMetadata, SchemaType } from "../model.js";

/** a schema that represents a choice of several values (ie, an 'enum') */
export interface ChoiceSchema<
  ChoiceType extends PrimitiveSchema = PrimitiveSchema,
> extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Choice;
  /** the primitive type for the choices */
  choiceType: ChoiceType;
  /** the possible choices for in the set */
  choices: Array<ChoiceValue>;

  crossLanguageDefinitionId?: string;
}

/** a schema that represents a choice of several values (ie, an 'enum') */
export interface SealedChoiceSchema<
  ChoiceType extends PrimitiveSchema = PrimitiveSchema,
> extends BaseSchema {
  /** the schema type  */
  type: SchemaType.SealedChoice;
  /** the primitive type for the choices */
  choiceType: ChoiceType;

  /** the possible choices for in the set */
  choices: Array<ChoiceValue>;

  crossLanguageDefinitionId?: string;
}

type ChoiceOptions<T extends ChoiceSchema | SealedChoiceSchema> = ModelOptions<T> &
  Pick<T, "choiceType" | "choices">;

export function createChoiceSchema(
  name: string,
  description: string,
  options: ChoiceOptions<ChoiceSchema>,
): ChoiceSchema {
  return initializeMetadata(
    {
      ...createSchema(name, description, SchemaType.Choice),
      choiceType: options.choiceType,
      choices: options.choices,
    },
    options,
  );
}

export function createSealedChoiceSchema(
  name: string,
  description: string,
  options: ChoiceOptions<SealedChoiceSchema>,
): SealedChoiceSchema {
  return initializeMetadata(
    {
      ...createSchema(name, description, SchemaType.SealedChoice),
      choiceType: options.choiceType,
      choices: options.choices,
    },
    options,
  );
}

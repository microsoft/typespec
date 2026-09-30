import type { BaseSchema, ModelOptions, ObjectSchema } from "../model.js";
import { createSchema, initializeMetadata, SchemaType } from "../model.js";

/** an OR relationship between several schemas
 *
 * @note - this expresses that the schema can be
 * any combination of the schema types given, which means
 * that this restricts the types to just <ObjectSchemaTypes>
 * because it does not make sense that a value can be a 'primitive'
 * and an 'object' at the same time. Nor does it make sense
 * that a value can be two primitive types at the same time.
 */
export interface OrSchema extends BaseSchema {
  type: SchemaType.Or;
  /** the set of schemas that this schema is composed of. Every schema is optional  */
  anyOf: Array<ObjectSchema>;
}

export function createOrSchema(
  name: string,
  description: string,
  options: ModelOptions<OrSchema> & Pick<OrSchema, "anyOf">,
): OrSchema {
  return initializeMetadata(
    { ...createSchema(name, description, SchemaType.Or), anyOf: options.anyOf },
    options,
  );
}

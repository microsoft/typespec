/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { ComplexSchema, ObjectSchema, Schema, SchemaType } from "@autorest/codemodel";
import { DeepPartial } from "@azure-tools/codegen";
import { SchemaUsage } from "./usage.js";

/** an OR relationship between several schemas
 *
 * @note - this expresses that the schema can be
 * any combination of the schema types given, which means
 * that this restricts the types to just <ObjectSchemaTypes>
 * because it does not make sense that a value can be a 'primitive'
 * and an 'object' at the same time. Nor does it make sense
 * that a value can be two primitive types at the same time.
 */
export interface OrSchema extends ComplexSchema, SchemaUsage {
  /** the set of schemas that this schema is composed of. Every schema is optional  */
  anyOf: Array<ObjectSchema>;
}
export class OrSchema extends Schema implements OrSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<OrSchema>) {
    super(name, description, SchemaType.Or);
    this.apply(objectInitializer);
  }
}

/** an XOR relationship between several schemas
 *
 * @note because this indicates that the actual schema
 * can be any one of the possible types, there is no
 * restriction on the type that it may be. (bool or object or number is ok)
 */
export interface XorSchema extends Schema {
  /** the set of schemas that this must be one and only one of. */
  oneOf: Array<Schema>;
}
export class XorSchema extends Schema implements XorSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<XorSchema>) {
    super(name, description, SchemaType.Xor);
    this.apply(objectInitializer);
  }
}

/**  a NOT relationship between schemas
 *
 * @fearthecowboy - I don't think we're going to implement this.
 */
export interface NotSchema extends Schema {
  /** the schema type  */
  type: SchemaType.Not;

  /** the schema that this may not be. */
  not: Schema;
}

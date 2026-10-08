// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import type { ChoiceSchema, SealedChoiceSchema } from "./schemas/choice.js";
import type { ConstantSchema } from "./schemas/constant.js";
import type {
  AnySchema,
  ArraySchema,
  BinarySchema,
  BooleanSchema,
  ByteArraySchema,
  DateSchema,
  DateTimeSchema,
  DictionarySchema,
  GroupSchema,
  NumberSchema,
  ObjectSchema,
  Schema,
  StringSchema,
  TimeSchema,
  UnixTimeSchema,
  UriSchema,
  UuidSchema,
} from "./schemas/model.js";
import { SchemaType } from "./schemas/model.js";
import type { OrSchema } from "./schemas/relationship.js";
import type { DurationSchema } from "./schemas/time.js";

/** the full set of schemas for a given service, categorized into convenient collections */
export interface Schemas {
  /** a collection of items */
  arrays?: Array<ArraySchema>;
  /** an associative array (ie, dictionary, hashtable, etc) */
  dictionaries?: Array<DictionarySchema>;
  /** a true or false value */
  booleans?: Array<BooleanSchema>;
  /** a number value */
  numbers?: Array<NumberSchema>;
  /** an object of some type */
  objects?: Array<ObjectSchema>;
  /** a string of characters  */
  strings?: Array<StringSchema>;
  /** UnixTime */
  unixtimes?: Array<UnixTimeSchema>;
  /** ByteArray -- an array of bytes */
  byteArrays?: Array<ByteArraySchema>;
  /** a Date */
  dates?: Array<DateSchema>;
  /** a time */
  times?: Array<TimeSchema>;
  /** a DateTime */
  dateTimes?: Array<DateTimeSchema>;
  /** a Duration */
  durations?: Array<DurationSchema>;
  /** a universally unique identifier  */
  uuids?: Array<UuidSchema>;
  /** an URI of some kind */
  uris?: Array<UriSchema>;
  /** a choice between one of several  values (ie, 'enum')
   *
   * @description - this is essentially can be thought of as an 'enum'
   * that is a choice between one of several items, but an unspecified value is permitted.
   */
  choices?: Array<ChoiceSchema>;
  /** a choice between one of several  values (ie, 'enum')
   *
   * @description - this is essentially can be thought of as an 'enum'
   * that is a choice between one of several items, but an unknown value is not allowed.
   */
  sealedChoices?: Array<SealedChoiceSchema>;
  /** a constant value */
  constants?: Array<ConstantSchema>;
  ors?: Array<OrSchema>;
  binaries?: Array<BinarySchema>;
  groups?: Array<GroupSchema>;
  any?: Array<AnySchema>;
}

export function createSchemas(): Schemas {
  return {};
}

export function addSchema<T extends Schema>(schemas: Schemas, schema: T): T;
export function addSchema(schemas: Schemas, schema: Schema): Schema {
  switch (schema.type) {
    case SchemaType.Any:
      if (!schemas.any?.[0]) schemas.any = [schema];
      return schemas.any[0];
    case SchemaType.Array:
      return register((schemas.arrays ??= []), schema, true);
    case SchemaType.Dictionary:
      return register((schemas.dictionaries ??= []), schema, true);
    case SchemaType.Boolean:
      return register((schemas.booleans ??= []), schema, true);
    case SchemaType.Integer:
    case SchemaType.Number:
      return register((schemas.numbers ??= []), schema, true);
    case SchemaType.String:
      return register((schemas.strings ??= []), schema, true);
    case SchemaType.UnixTime:
      return register((schemas.unixtimes ??= []), schema, true);
    case SchemaType.ByteArray:
      return register((schemas.byteArrays ??= []), schema, true);
    case SchemaType.Date:
      return register((schemas.dates ??= []), schema, true);
    case SchemaType.Time:
      return register((schemas.times ??= []), schema, true);
    case SchemaType.DateTime:
      return register((schemas.dateTimes ??= []), schema, true);
    case SchemaType.Duration:
      return register((schemas.durations ??= []), schema, true);
    case SchemaType.Uuid:
      return register((schemas.uuids ??= []), schema, true);
    case SchemaType.Uri:
      return register((schemas.uris ??= []), schema, true);
    case SchemaType.Object:
      return register((schemas.objects ??= []), schema, false);
    case SchemaType.Group:
      return register((schemas.groups ??= []), schema, false);
    case SchemaType.Binary:
      return register((schemas.binaries ??= []), schema, false);
    case SchemaType.Or:
      return register((schemas.ors ??= []), schema, false);
    // These Java-specific schemas were not instances of the upstream registry's classes.
    case SchemaType.Choice:
      return register((schemas.choices ??= []), schema, false);
    case SchemaType.SealedChoice:
      return register((schemas.sealedChoices ??= []), schema, false);
    case SchemaType.Constant:
      return register((schemas.constants ??= []), schema, false);
  }
}

function register<T extends Schema>(collection: T[], schema: T, deduplicate: boolean): T {
  if (deduplicate && canStringify(schema)) {
    const serialized = JSON.stringify(schema);
    for (const existing of collection) {
      // The old registry stopped comparing once it encountered a cyclic candidate.
      if (!canStringify(existing)) break;
      if (JSON.stringify(existing) === serialized) return existing;
    }
  }
  if (collection.includes(schema)) {
    throw new Error(`Duplicate ! ${schema.type} : ${schema.language.default.name}`);
  }
  collection.push(schema);
  return schema;
}

function canStringify(value: unknown, ancestors = new Set<object>()): boolean {
  if (typeof value === "bigint") return false;
  if (typeof value !== "object" || value === null) return true;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  const result = Object.values(value).every((child) => canStringify(child, ancestors));
  ancestors.delete(value);
  return result;
}

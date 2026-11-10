import type { BaseSchema, ModelOptions } from "./model.js";
import { createSchema, initializeMetadata, SchemaType } from "./model.js";

/** a schema that represents a Duration value */
export interface DurationSchema extends BaseSchema {
  /** the schema type  */
  type: SchemaType.Duration;

  format:
    | "duration-rfc3339"
    | "seconds-integer"
    | "seconds-number"
    | "milliseconds-integer"
    | "milliseconds-number";
}

export function createDurationSchema(
  name: string,
  description: string,
  options?: ModelOptions<DurationSchema>,
): DurationSchema {
  return initializeMetadata(
    {
      ...createSchema(
        name.includes("\u00b7") ? SchemaType.Duration : name,
        description,
        SchemaType.Duration,
      ),
      format: "duration-rfc3339",
    },
    options,
  );
}

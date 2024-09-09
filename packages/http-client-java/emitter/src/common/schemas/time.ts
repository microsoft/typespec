/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import { PrimitiveSchema, SchemaType } from "@autorest/codemodel";
import { DeepPartial } from "@azure-tools/codegen";

/** a schema that represents a Duration value */
export interface DurationSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Duration;

  format: "duration-rfc3339" | "seconds-integer" | "seconds-number";
}

export class DurationSchema extends PrimitiveSchema implements DurationSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<DurationSchema>) {
    super(name, description, SchemaType.Duration);
    this.format = "duration-rfc3339";
    this.apply(objectInitializer);
  }
}

/** a schema that represents a DateTime value */
export interface DateTimeSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.DateTime;

  /** date-time format  */
  format: "date-time-rfc1123" | "date-time";
}

export class DateTimeSchema extends PrimitiveSchema implements DateTimeSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<DateTimeSchema>) {
    super(name, description, SchemaType.DateTime);
    this.apply(objectInitializer);
  }
}

/** a schema that represents a Date value */
export interface DateSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Date;
}

export class DateSchema extends PrimitiveSchema implements DateSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<DateSchema>) {
    super(name, description, SchemaType.Date);
    this.apply(objectInitializer);
  }
}

/** a schema that represents a Date value */
export interface TimeSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.Time;
}

export class TimeSchema extends PrimitiveSchema implements TimeSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<TimeSchema>) {
    super(name, description, SchemaType.Time);
    this.apply(objectInitializer);
  }
}

/** a schema that represents a UnixTime value */
export interface UnixTimeSchema extends PrimitiveSchema {
  /** the schema type  */
  type: SchemaType.UnixTime;
}

export class UnixTimeSchema extends PrimitiveSchema implements UnixTimeSchema {
  constructor(name: string, description: string, objectInitializer?: DeepPartial<UnixTimeSchema>) {
    super(name, description, SchemaType.UnixTime);
    this.apply(objectInitializer);
  }
}

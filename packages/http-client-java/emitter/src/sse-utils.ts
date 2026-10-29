import type { ObjectSchema, Schema } from "./common/schemas/model.js";
import {
  addProperty,
  createObjectSchema,
  createProperty,
  createStringSchema,
} from "./common/schemas/model.js";

const SSE_STREAM_EVENT_SUFFIX = "StreamEvent";

export interface SseSchemas {
  baseSchema: ObjectSchema;
  eventSchemas: Map<string, ObjectSchema>;
}

export function createSseSchemas({
  streamName,
  sourceNamespace,
  javaNamespace,
  events,
}: {
  streamName: string;
  sourceNamespace: string | undefined;
  javaNamespace: string;
  events: readonly { name: string; payload: Schema }[];
}): SseSchemas {
  const { baseName, eventNames } = resolveSseSchemaNames(
    streamName,
    events.map((event) => event.name),
  );
  const schemaLanguage = (name: string) => ({
    default: {
      name,
      namespace: sourceNamespace,
    },
    java: {
      namespace: javaNamespace,
    },
  });
  const baseSchema = createObjectSchema(
    baseName,
    `Base for polymorphic events emitted by ${streamName}.`,
    {
      language: schemaLanguage(baseName),
    },
  );
  addProperty(
    baseSchema,
    createProperty("eventName", "The server-sent event name.", createStringSchema("string", ""), {
      required: true,
      nullable: false,
      readOnly: true,
      serializedName: "eventName",
    }),
  );

  const eventSchemas = new Map<string, ObjectSchema>();
  for (const { name, payload } of events) {
    const schemaName = eventNames.get(name)!;
    const eventSchema = createObjectSchema(
      schemaName,
      `Represents the '${name}' ${streamName} event.`,
      {
        language: schemaLanguage(schemaName),
        parents: {
          immediate: [baseSchema],
          all: [baseSchema],
        },
      },
    );
    addProperty(
      eventSchema,
      createProperty("value", "The event payload.", payload, {
        required: true,
        nullable: false,
        readOnly: true,
        serializedName: "value",
      }),
    );
    eventSchemas.set(name, eventSchema);
  }
  return { baseSchema, eventSchemas };
}

function resolveSseSchemaNames(
  streamName: string,
  eventNames: string[],
): { baseName: string; eventNames: Map<string, string> } {
  const normalizedStreamName = javaToPascalCase(streamName);
  const baseName = normalizedStreamName.endsWith("Events")
    ? normalizedStreamName.slice(0, -1)
    : `${normalizedStreamName}Event`;
  const baseStem = baseName.endsWith(SSE_STREAM_EVENT_SUFFIX)
    ? baseName.slice(0, -SSE_STREAM_EVENT_SUFFIX.length)
    : baseName;
  const resolvedEventNames = new Map<string, string>();
  const wireNamesBySchemaName = new Map<string, string>();
  for (const eventName of eventNames) {
    let prefix = baseStem;
    const firstSegment = eventName
      .split(/[^A-Za-z0-9]+/)
      .filter((segment) => segment.length > 0)
      .map(javaToPascalCase)[0];
    if (firstSegment && baseStem.endsWith(firstSegment)) {
      prefix = baseStem.slice(0, -firstSegment.length);
    }
    const normalizedEventName = eventName
      .split(/[^A-Za-z0-9]+/)
      .filter((segment) => segment.length > 0)
      .map(javaToPascalCase)
      .join("");
    const schemaName = `${prefix}${normalizedEventName}${SSE_STREAM_EVENT_SUFFIX}`;
    const collidingWireName = wireNamesBySchemaName.get(schemaName);
    if (schemaName === baseName) {
      throw new Error(
        `SSE event name '${eventName}' resolves to duplicate schema name '${schemaName}', which is already used by the stream base schema.`,
      );
    }
    if (collidingWireName !== undefined) {
      throw new Error(
        `SSE event names '${collidingWireName}' and '${eventName}' resolve to duplicate schema name '${schemaName}'.`,
      );
    }
    wireNamesBySchemaName.set(schemaName, eventName);
    resolvedEventNames.set(eventName, schemaName);
  }
  return { baseName, eventNames: resolvedEventNames };
}

function javaToPascalCase(name: string): string {
  if (!name || name.trim().length === 0) {
    return name;
  }
  if (name.startsWith("_")) {
    return `_${javaToCamelCase(name.slice(1))}`;
  }
  return name
    .split(/[_\- ]/)
    .filter((segment) => segment.length > 0)
    .map((segment) => javaFormatCase(segment, false))
    .join("");
}

function javaToCamelCase(name: string): string {
  if (!name || name.trim().length === 0) {
    return name;
  }
  if (name.startsWith("_")) {
    return javaToCamelCase(name.slice(1));
  }
  const segments = name.split(/[_\- ]/);
  if (segments.length === 0) {
    return "";
  }
  return segments.map((segment, index) => javaFormatCase(segment, index === 0)).join("");
}

function javaFormatCase(name: string, lowerFirst: boolean): string {
  if (name.length === 0) {
    return name;
  }
  if (
    name.length < 2 ||
    (name.length === 2 && name[0] === name[0].toUpperCase() && name[1] === name[1].toUpperCase())
  ) {
    return lowerFirst ? name.toLowerCase() : name.toUpperCase();
  }
  return `${lowerFirst ? name[0].toLowerCase() : name[0].toUpperCase()}${name.slice(1)}`;
}

import type { ObjectSchema, Schema } from "./common/schemas/model.js";
import {
  addProperty,
  createObjectSchema,
  createProperty,
  createRelations,
  createStringSchema,
} from "./common/schemas/model.js";
import { SchemaContext } from "./common/schemas/usage.js";

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
  events: readonly {
    name: string;
    payload: Schema;
    terminal: boolean;
    schemaName?: string;
    isExactName?: boolean;
  }[];
}): SseSchemas {
  const { baseName, eventNames } = resolveSseSchemaNames(
    streamName,
    events.map(({ name, schemaName }) => ({ name, schemaName })),
  );
  const schemaLanguage = (name: string, isExactName = false) => ({
    default: {
      name,
      namespace: sourceNamespace,
    },
    java: {
      ...(isExactName ? { name } : {}),
      namespace: javaNamespace,
    },
  });
  const baseSchema = createObjectSchema(
    baseName,
    `Base for polymorphic events emitted by ${streamName}.`,
    {
      language: schemaLanguage(baseName),
      usage: [SchemaContext.Sse],
      sseMetadata: { streamName },
      children: createRelations(),
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
  for (const { name, payload, terminal, isExactName } of events) {
    const schemaName = eventNames.get(name)!;
    const eventSchema = createObjectSchema(
      schemaName,
      `Represents the '${name}' ${streamName} event.`,
      {
        language: schemaLanguage(schemaName, isExactName),
        usage: [SchemaContext.Sse],
        sseMetadata: { streamName, eventName: name, terminal },
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
    baseSchema.children!.immediate.push(eventSchema);
    baseSchema.children!.all.push(eventSchema);
    eventSchemas.set(name, eventSchema);
  }
  return { baseSchema, eventSchemas };
}

function resolveSseSchemaNames(
  streamName: string,
  events: readonly { name: string; schemaName?: string }[],
): { baseName: string; eventNames: Map<string, string> } {
  const normalizedStreamName = javaToPascalCase(streamName);
  const baseName = normalizedStreamName.endsWith("Events")
    ? normalizedStreamName.slice(0, -1)
    : `${normalizedStreamName}Event`;
  const resolvedEventNames = new Map<string, string>();
  const wireNamesBySchemaName = new Map<string, string>();
  for (const { name: eventName, schemaName: requestedSchemaName } of events) {
    const normalizedEventName = eventName
      .split(/[^A-Za-z0-9]+/)
      .filter((segment) => segment.length > 0)
      .map(javaToPascalCase)
      .join("");
    const schemaName = requestedSchemaName ?? `${normalizedEventName}${baseName}`;
    const collidingWireName = wireNamesBySchemaName.get(schemaName);
    if (schemaName === baseName) {
      throw new Error(
        `SSE union '${streamName}' event wrapper name '${schemaName}' for wire event '${eventName}' conflicts with the stream base schema.`,
      );
    }
    if (collidingWireName !== undefined) {
      throw new Error(
        `SSE union '${streamName}' event wrapper name '${schemaName}' is requested by wire events '${collidingWireName}' and '${eventName}'.`,
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

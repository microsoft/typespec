import { Program, Type, Union } from "@typespec/compiler";
import { ResolvedOpenAPI3EmitterOptions } from "./openapi.js";
import { OpenAPIMediaType3_2, OpenAPISchema3_2, Refable } from "./types.js";

export interface SSEModule {
  isSSEStream(program: Program, type: Type): boolean;
  getSSEStreamType(program: Program, type: Type): Type | undefined;
  attachSSEItemSchema(
    program: Program,
    options: ResolvedOpenAPI3EmitterOptions,
    streamType: Type,
    emitObject: OpenAPIMediaType3_2,
    getSchemaForType: (type: Type) => any,
  ): void;
}

export async function resolveSSEModule(): Promise<SSEModule | undefined> {
  const [streams, events, sse] = await Promise.all([
    tryImportStreams(),
    tryImportEvents(),
    tryImportSSE(),
  ]);

  if (streams === undefined || events === undefined || sse === undefined) {
    return undefined;
  }

  return {
    isSSEStream: (program: Program, type: Type): boolean => {
      if (type.kind !== "Model") return false;
      // Check if this is a stream - we rely on contentType filtering in the caller
      const streamOf = streams.getStreamOf(program, type);
      return !!streamOf;
    },

    getSSEStreamType: (program: Program, type: Type): Type | undefined => {
      if (type.kind !== "Model") return undefined;
      return streams.getStreamOf(program, type);
    },

    attachSSEItemSchema: (
      program: Program,
      options: ResolvedOpenAPI3EmitterOptions,
      streamType: Type,
      emitObject: OpenAPIMediaType3_2,
      getSchemaForType: (type: Type) => Refable<OpenAPISchema3_2>,
    ): void => {
      // Check if the stream type is a union with @events decorator
      if (streamType.kind !== "Union") return;

      const isEventsUnion = events.isEvents(program, streamType);
      if (!isEventsUnion) return;

      // Get event definitions
      const [eventDefinitions, diagnostics] = events.unsafe_getEventDefinitions(program, streamType);
      if (diagnostics && diagnostics.length) {
        // TODO: Handle diagnostics
        return;
      }

      if (!eventDefinitions || eventDefinitions.length === 0) return;

      // Build the itemSchema structure
      // The itemSchema should have a oneOf with all event variants
      const oneOfSchemas: Refable<OpenAPISchema3_2>[] = [];

      for (const eventDef of eventDefinitions) {
        const variant = eventDef.root;
        const eventType = eventDef.eventType;
        const payloadType = eventDef.payloadType;
        const payloadContentType = eventDef.payloadContentType || "application/json";

        // Check if this is a terminal event
        const isTerminal = sse.isTerminalEvent(program, variant);

        // Build the event schema
        const eventSchema: any = {
          type: "object",
          properties: {
            event: {
              type: "string",
            },
            data: {
              type: "string",
            },
          },
          required: ["event"],
        };

        // Build the oneOf variant schema
        const variantSchema: any = {
          properties: {
            data: {
              contentMediaType: payloadContentType,
            },
          },
        };

        if (isTerminal) {
          // For terminal events, set the extension
          variantSchema["x-ms-sse-terminal-event"] = true;

          // If the variant type is a string literal, use it as const
          if (variant.type.kind === "String") {
            variantSchema.properties.data.const = variant.type.value;
            variantSchema.properties.data.contentMediaType = payloadContentType;
          }
        } else {
          // For non-terminal events, add the event type
          if (eventType) {
            variantSchema.properties.event = {
              const: eventType,
            };
          }

          // Add contentSchema for the payload
          variantSchema.properties.data.contentSchema = getSchemaForType(payloadType);
        }

        oneOfSchemas.push(variantSchema);
      }

      // Set the itemSchema with the base structure and oneOf
      emitObject.itemSchema = {
        type: "object",
        properties: {
          event: {
            type: "string",
          },
          data: {
            type: "string",
          },
        },
        required: ["event"],
        oneOf: oneOfSchemas as any,
      };
    },
  };
}

async function tryImportStreams(): Promise<typeof import("@typespec/streams") | undefined> {
  try {
    const module = await import("@typespec/streams");
    return module;
  } catch {
    return undefined;
  }
}

async function tryImportEvents(): Promise<
  (typeof import("@typespec/events") & typeof import("@typespec/events/experimental")) | undefined
> {
  try {
    const eventsModule = await import("@typespec/events");
    const experimentalModule = await import("@typespec/events/experimental");
    return { ...eventsModule, ...experimentalModule };
  } catch {
    return undefined;
  }
}

async function tryImportSSE(): Promise<typeof import("@typespec/sse") | undefined> {
  try {
    const module = await import("@typespec/sse");
    return module;
  } catch {
    return undefined;
  }
}

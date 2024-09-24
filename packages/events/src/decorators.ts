import {
  navigateType,
  type Diagnostic,
  type Model,
  type ModelProperty,
  type Program,
  type Tuple,
  type Type,
  type Union,
  type UnionVariant,
} from "@typespec/compiler";
import type {
  ContentTypeDecorator,
  DataDecorator,
  EventsDecorator,
} from "../generated-defs/TypeSpec.Events.js";
import { createDiagnostic, EventsStateKeys } from "./lib.js";

/** @internal */
export const namespace = "TypeSpec.Events";

export const $events: EventsDecorator = (context, target) => {
  context.program.stateSet(EventsStateKeys.events).add(target);
};

export function isEvents(program: Program, target: Union): boolean {
  return program.stateSet(EventsStateKeys.events).has(target);
}

export const $contentType: ContentTypeDecorator = (context, target, contentType) => {
  context.program.stateMap(EventsStateKeys.contentType).set(target, contentType);
};

export function getContentType(
  program: Program,
  target: UnionVariant | ModelProperty,
): string | undefined {
  return program.stateMap(EventsStateKeys.contentType).get(target);
}

function validateContentType(program: Program, target: ModelProperty): Diagnostic[] {
  const contentType = getContentType(program, target);
  if (!contentType || isEventData(program, target)) return [];

  return [
    createDiagnostic({
      code: "invalid-content-type-target",
      target,
    }),
  ];
}

export const $data: DataDecorator = (context, target) => {
  context.program.stateSet(EventsStateKeys.data).add(target);
};

export function isEventData(program: Program, target: ModelProperty): boolean {
  return program.stateSet(EventsStateKeys.data).has(target);
}

function stringifyPropertyPath(path: Array<Model | ModelProperty | Tuple>): string {
  return path
    .map((p) => {
      switch (p.kind) {
        case "ModelProperty":
          return p.name;
        case "Tuple":
          return "[]";
        case "Model":
          return;
      }
    })
    .filter(Boolean)
    .join(".");
}

function getEventDefinition(
  program: Program,
  target: UnionVariant,
): [EventDefinition, readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];

  // If the variant has a name, that may be used for out-of-band event types.
  const eventType = typeof target.name === "string" ? target.name : undefined;
  const envelopeContentType = getContentType(program, target);

  let payloadType: Type | undefined;
  let payloadContentType: string | undefined;
  let pathToPayload: string = "";

  // Keeps track of if we're in a Record or Array.
  let indexerDepth = 0;

  // Keeps track of the path from the target to the current model property.
  const currentPropertyPath: Array<ModelProperty | Tuple | Model> = [];

  // Keeps track of the types that have a descendant that leads to the event payload.
  const typesThatChainToPayload = new Set<Type>();

  // Look for a model property that is decorated with `@data`.
  // This property will be used as the event payload.
  // It can only be applied once within an event, and if it is not found,
  // the target type is the payload.
  navigateType(
    target.type,
    {
      modelProperty(prop) {
        currentPropertyPath.push(prop);
        diagnostics.push(...validateContentType(program, prop));

        // This detects the scenario where a model that contains a `@data` property
        // is referenced multiple times directly or indirectly by the target event.
        if (typesThatChainToPayload.has(prop.type)) {
          diagnostics.push(
            createDiagnostic({
              code: "multiple-event-payloads",
              format: {
                dataPath: pathToPayload,
                currentPath: stringifyPropertyPath(currentPropertyPath),
              },
              target,
            }),
          );
          return;
        }

        // Haven't found a payload property yet, move on.
        if (!isEventData(program, prop)) return;

        // Mark all the types in the current path as having a descendant that leads to the payload.
        currentPropertyPath.forEach((p) => {
          if (p.kind === "ModelProperty") {
            typesThatChainToPayload.add(p.type);
          } else if (p.kind === "Model" || p.kind === "Tuple") {
            typesThatChainToPayload.add(p);
          }
        });

        // Found the payload property but it's referenced indirectly by
        // a Record or Array, which implies there would be more than 1 payload.
        if (indexerDepth > 0) {
          diagnostics.push(
            createDiagnostic({
              code: "multiple-event-payloads",
              messageId: "payloadInIndexedModel",
              format: {
                dataPath: stringifyPropertyPath(currentPropertyPath.slice(0, -1)),
              },
              target,
            }),
          );
          return;
        }

        // A payload type was previously found, but only one is allowed.
        if (payloadType) {
          diagnostics.push(
            createDiagnostic({
              code: "multiple-event-payloads",
              format: {
                dataPath: pathToPayload,
                currentPath: stringifyPropertyPath(currentPropertyPath),
              },
              target,
            }),
          );
          return;
        }

        // A payload property was found.
        payloadType = prop.type;
        payloadContentType = getContentType(program, prop);
        pathToPayload = stringifyPropertyPath(currentPropertyPath);
      },
      exitModelProperty() {
        currentPropertyPath.pop();
      },
      tuple(tuple) {
        currentPropertyPath.push(tuple);
        // Check if any of the tuple values have already been marked as a payload/payload ancestor.
        // They won't be visited again, so need to create diagnostic here.
        tuple.values.forEach((value) => {
          if (typesThatChainToPayload.has(value)) {
            diagnostics.push(
              createDiagnostic({
                code: "multiple-event-payloads",
                format: {
                  dataPath: pathToPayload,
                  currentPath: stringifyPropertyPath(currentPropertyPath),
                },
                target,
              }),
            );
            return;
          }
        });
      },
      exitTuple() {
        currentPropertyPath.pop();
      },
      model(model) {
        if (model.indexer) {
          indexerDepth++;
        }
        currentPropertyPath.push(model);
      },
      exitModel(model) {
        if (model.indexer) {
          indexerDepth--;
        }
        currentPropertyPath.pop();
      },
    },
    {},
  );

  const eventDefinition: EventDefinition = {
    eventType,
    root: target,
    isEventEnvelope: !!payloadType,
    type: target.type,
    contentType: envelopeContentType,
    payloadType: payloadType ?? target.type,
    payloadContentType: payloadType ? payloadContentType : envelopeContentType,
  };

  return [eventDefinition, diagnostics];
}

export function getEventDefinitions(
  program: Program,
  target: Union,
): [EventDefinition[], readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];
  // 1. Iterate over each variant of the action
  const events: EventDefinition[] = [];

  target.variants.forEach((variant) => {
    const [event, variantDiagnostics] = getEventDefinition(program, variant);
    events.push(event);
    diagnostics.push(...variantDiagnostics);
  });

  return [events, diagnostics];
}

/**
 * Represents the definition of an event.
 */
export interface EventDefinition {
  /**
   * The name of the event type.
   * This may be used when the underlying event protocol supports event types
   * out-of-band from the event evelope or event payload.
   */
  eventType?: string;
  /**
   * The root variant of the union that represents the event.
   */
  root: UnionVariant;
  /**
   * Indicates whether the `type` describes an event envelope
   * with a separate event payload.
   */
  isEventEnvelope: boolean;
  /**
   * The type of the event.
   * This represents an event envelope if `isEventEnvelope` is `true`.
   */
  type: Type;
  /**
   * The content type of the event.
   * This represents the content type of the event envelope if `isEventEnvelope` is `true`.
   */
  contentType?: string;
  /**
   * The type of the event payload.
   * This matches `type` if `isEventEnvelope` is `false`.
   */
  payloadType: Type;
  /**
   * The content type of the event payload.
   * This matches `contentType` if `isEventEnvelope` is `false`.
   */
  payloadContentType?: string;
}

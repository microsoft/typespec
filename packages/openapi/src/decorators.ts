import {
  compilerAssert,
  DecoratorContext,
  getDoc,
  getService,
  getSummary,
  isErrorModel,
  isType,
  Model,
  Namespace,
  Operation,
  Program,
  serializeValueAsJson,
  Type,
  Value,
} from "@typespec/compiler";
import { useStateMap, useStateSet } from "@typespec/compiler/utils";
import * as http from "@typespec/http";
import {
  DefaultResponseDecorator,
  ExtensionDecorator,
  ExternalDocsDecorator,
  InfoDecorator,
  OperationIdDecorator,
  TagMetadata,
  TagMetadataDecorator,
  TagMetadataWithName as TagMetadataWithNameInput,
} from "../generated-defs/TypeSpec.OpenAPI.js";
import { validateAdditionalInfoModel, validateIsUri } from "./helpers.js";
import { createDiagnostic, createStateSymbol, OpenAPIKeys, reportDiagnostic } from "./lib.js";
import { AdditionalInfo, ExtensionKey, ExternalDocs, TagMetadataWithName } from "./types.js";

export const [
  /**
   * Returns operationId set via the `@operationId` decorator or `undefined`
   */
  getOperationId,

  /**
   * Set a specific operation ID programmatically. Equivalent of using `@operationId` decorator.
   * @param program TypeSpec Program
   * @param entity Operation to set ID for
   * @param opId Operation ID
   */
  setOperationId,
] = useStateMap<Operation, string>(createStateSymbol("operationIds"));
/**
 * Set a specific operation ID.
 * @param context Decorator Context
 * @param entity Decorator target
 * @param opId Operation ID.
 */
export const $operationId: OperationIdDecorator = (
  context: DecoratorContext,
  entity: Operation,
  opId: string,
) => {
  setOperationId(context.program, entity, opId);
};

const openApiExtensionKey = createStateSymbol("openApiExtension");

/** {@inheritdoc ExtensionDecorator} */
export const $extension: ExtensionDecorator = (
  context: DecoratorContext,
  entity: Type,
  extensionName: string,
  value: unknown,
) => {
  compilerAssert(
    !value || !isType(value as any),
    "OpenAPI extension value must be a value but was a type",
    context.getArgumentTarget(1),
  );
  const processed = convertRemainingValuesToExtensions(context.program, value);
  setExtension(context.program, entity, extensionName as ExtensionKey, processed);
};

// Workaround until we have a way to disable arg marshalling and just call serializeValueAsJson
// https://github.com/microsoft/typespec/issues/3570
function convertRemainingValuesToExtensions(program: Program, value: unknown): unknown {
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
      return value;
    case "object":
      if (value === null) {
        return null;
      }
      if (Array.isArray(value)) {
        return value.map((x) => convertRemainingValuesToExtensions(program, x));
      }

      if (isTypeSpecValue(value)) {
        return serializeValueAsJson(program, value, value.type);
      } else {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          if (val === undefined) {
            continue;
          }
          result[key] = convertRemainingValuesToExtensions(program, val);
        }
        return result;
      }
    default:
      return value;
  }
}

function isTypeSpecValue(value: object): value is Value {
  return "entityKind" in value && value.entityKind === "Value";
}

/**
 * Set the OpenAPI info node on for the given service namespace.
 * @param program Program
 * @param entity Service namespace
 * @param data OpenAPI Info object
 */
export function setInfo(
  program: Program,
  entity: Namespace,
  data: AdditionalInfo & Record<ExtensionKey, unknown>,
) {
  program.stateMap(infoKey).set(entity, data);
}

/**
 *  Set OpenAPI extension on the given type. Equivalent of using `@extension` decorator
 * @param program Program
 * @param entity Type to annotate
 * @param extensionName Extension key
 * @param data Extension value
 */
export function setExtension(program: Program, entity: Type, extensionName: string, data: unknown) {
  const openApiExtensions = program.stateMap(openApiExtensionKey);
  const typeExtensions = openApiExtensions.get(entity) ?? new Map<string, any>();
  typeExtensions.set(extensionName, data);
  openApiExtensions.set(entity, typeExtensions);
}

/**
 * Get extensions set for the given type.
 * @param program Program
 * @param entity Type
 */
export function getExtensions(program: Program, entity: Type): ReadonlyMap<ExtensionKey, any> {
  return program.stateMap(openApiExtensionKey).get(entity) ?? new Map<ExtensionKey, any>();
}

/**
 * The @defaultResponse decorator can be applied to a model. When that model is used
 * as the return type of an operation, this return type will be the default response.
 *
 */
const defaultResponseKey = createStateSymbol("defaultResponse");
/** {@inheritdoc DefaultResponseDecorator} */
export const $defaultResponse: DefaultResponseDecorator = (
  context: DecoratorContext,
  entity: Model,
) => {
  (http as any).setStatusCode(context.program, entity, ["*"]);
  context.program.stateSet(defaultResponseKey).add(entity);

  return {
    onTargetFinish: () => {
      const diagnostics: ReturnType<typeof createDiagnostic>[] = [];

      // Warn if the model already has a @statusCode property
      for (const prop of entity.properties.values()) {
        if (http.isStatusCode(context.program, prop)) {
          diagnostics.push(
            createDiagnostic({
              code: "default-response-with-status-code",
              messageId: "statusCode",
              target: entity,
            }),
          );
          break;
        }
      }

      // Warn if the model is marked with @error
      if (isErrorModel(context.program, entity)) {
        diagnostics.push(
          createDiagnostic({
            code: "default-response-with-status-code",
            messageId: "error",
            target: entity,
          }),
        );
      }

      return diagnostics;
    },
  };
};

/**
 * Check if the given model has been mark as a default response.
 * @param program TypeSpec Program
 * @param entity Model to check.
 * @returns boolean.
 */
export function isDefaultResponse(program: Program, entity: Type): boolean {
  return program.stateSet(defaultResponseKey).has(entity);
}

const externalDocsKey = createStateSymbol("externalDocs");

/**
 * Allows referencing an external resource for extended documentation.
 * @param url The URL for the target documentation. Value MUST be in the format of a URL.
 * @param description A short description of the target documentation.
 */
export const $externalDocs: ExternalDocsDecorator = (
  context: DecoratorContext,
  target: Type,
  url: string,
  description?: string,
) => {
  const doc: ExternalDocs = { url };
  if (description) {
    doc.description = description;
  }
  context.program.stateMap(externalDocsKey).set(target, doc);
};

/**
 * Return external doc info set via the `@externalDocs` decorator.
 * @param program Program
 * @param entity Type
 */
export function getExternalDocs(program: Program, entity: Type): ExternalDocs | undefined {
  return program.stateMap(externalDocsKey).get(entity);
}

const infoKey = createStateSymbol("info");

/** {@inheritdoc InfoDecorator} */
export const $info: InfoDecorator = (
  context: DecoratorContext,
  entity: Namespace,
  data: AdditionalInfo & Record<ExtensionKey, unknown>,
) => {
  if (data === undefined) {
    return;
  }

  // Validate the AdditionalInfo model
  if (
    !validateAdditionalInfoModel(
      context.program,
      context.getArgumentTarget(0)!,
      data,
      "TypeSpec.OpenAPI.AdditionalInfo",
    )
  ) {
    return;
  }

  // Validate termsOfService
  if (data.termsOfService) {
    if (
      !validateIsUri(
        context.program,
        context.getArgumentTarget(0)!,
        data.termsOfService,
        "TermsOfService",
      )
    ) {
      return;
    }
  }
  setInfo(context.program, entity, data);
};

/**
 * Get the info entry for the given service namespace.
 * @param program Program
 * @param entity Service namespace
 */
export function getInfo(program: Program, entity: Namespace): AdditionalInfo | undefined {
  return program.stateMap(infoKey).get(entity);
}

/** Resolve the info entry by merging data specified with `@service`, `@summary` and `@info`. */
export function resolveInfo(program: Program, entity: Namespace): AdditionalInfo | undefined {
  const info = getInfo(program, entity);
  const service = getService(program, entity);
  return omitUndefined({
    ...info,
    title: info?.title ?? service?.title,
    version: info?.version,
    summary: info?.summary ?? getSummary(program, entity),
    description: info?.description ?? getDoc(program, entity),
  });
}

function omitUndefined<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined)) as any;
}

/** Get TagsMetadata set with `@tagMetadata` decorator */
const [getTagsMetadata, setTagsMetadata] = useStateMap<Type, TagMetadataWithName[]>(
  OpenAPIKeys.tagsMetadata,
);

/**
 * State set tracking namespaces that have used the array form of @tagMetadata.
 * Used to detect mixing of array and inline forms.
 */
const [isTagsMetadataArrayFormUsed, setTagsMetadataArrayFormUsed] = useStateSet<Type>(
  createStateSymbol("tagsMetadataArrayForm"),
);

/**
 * Decorator to add metadata to a tag associated with a namespace.
 * Supports two forms:
 * - Inline form: `@tagMetadata("tag-name", #{...})` - adds a single tag by name
 * - Array form: `@tagMetadata(#[#{name: "tag1", ...}, ...])` - sets an ordered list of tags
 *
 * @param context - The decorator context.
 * @param entity - The namespace entity to associate the tag with.
 * @param name - The name of the tag (inline form) or an array of tag metadata objects (array form).
 * @param tagMetadata - Optional metadata for the tag. Only used in inline form.
 */
export const tagMetadataDecorator: TagMetadataDecorator = (
  context: DecoratorContext,
  entity: Namespace,
  name: string | readonly TagMetadataWithNameInput[],
  tagMetadata?: TagMetadata,
) => {
  // Check if the namespace is a service namespace
  if (
    !entity.decorators.some(
      (decorator) =>
        decorator.definition?.name === "@service" &&
        decorator.definition?.namespace.name === "TypeSpec",
    )
  ) {
    reportDiagnostic(context.program, {
      code: "tag-metadata-target-service",
      format: {
        namespace: entity.name,
      },
      target: context.getArgumentTarget(0)!,
    });
    return;
  }

  if (typeof name !== "string") {
    // Array form: @tagMetadata(#[#{name: "tag1", ...}, ...])
    // Check that no tagMetadata argument was provided (third argument not allowed with array form)
    if (tagMetadata !== undefined) {
      reportDiagnostic(context.program, {
        code: "tag-metadata-array-with-metadata-arg",
        target: context.getArgumentTarget(1)!,
      });
      return;
    }

    // Check if either inline form or array form was already used (cannot mix or call twice)
    const existingTags = getTagsMetadata(context.program, entity);
    if (
      (existingTags && existingTags.length > 0) ||
      isTagsMetadataArrayFormUsed(context.program, entity)
    ) {
      reportDiagnostic(context.program, {
        code: "mixed-tag-metadata-form",
        target: context.getArgumentTarget(0)!,
      });
      return;
    }

    // Validate and store all tags from the array
    for (const tagItem of name) {
      if (
        !validateAdditionalInfoModel(
          context.program,
          context.getArgumentTarget(0)!,
          tagItem,
          "TypeSpec.OpenAPI.TagMetadataWithName",
        )
      ) {
        return;
      }

      if (tagItem.externalDocs?.url) {
        if (
          !validateIsUri(
            context.program,
            context.getArgumentTarget(0)!,
            tagItem.externalDocs.url,
            "externalDocs.url",
          )
        ) {
          return;
        }
      }
    }

    setTagsMetadataArrayFormUsed(context.program, entity);
    setTagsMetadata(context.program, entity, [...name]);
  } else {
    // Inline form: @tagMetadata("tag-name", #{...})
    // Check if array form was already used
    if (isTagsMetadataArrayFormUsed(context.program, entity)) {
      reportDiagnostic(context.program, {
        code: "mixed-tag-metadata-form",
        target: context.getArgumentTarget(0)!,
      });
      return;
    }

    // Retrieve existing tags metadata or initialize an empty array
    const tags = getTagsMetadata(context.program, entity) ?? [];

    // Check for duplicate tag names
    if (tags.some((t) => t.name === name)) {
      reportDiagnostic(context.program, {
        code: "duplicate-tag",
        format: { tagName: name },
        target: context.getArgumentTarget(0)!,
      });
      return;
    }

    const resolvedMetadata: TagMetadata = tagMetadata ?? {};

    // Validate the additionalInfo model
    if (
      !validateAdditionalInfoModel(
        context.program,
        context.getArgumentTarget(0)!,
        resolvedMetadata,
        "TypeSpec.OpenAPI.TagMetadata",
      )
    ) {
      return;
    }

    // Validate the externalDocs.url property
    if (resolvedMetadata.externalDocs?.url) {
      if (
        !validateIsUri(
          context.program,
          context.getArgumentTarget(0)!,
          resolvedMetadata.externalDocs.url,
          "externalDocs.url",
        )
      ) {
        return;
      }
    }

    // Update the tags metadata with the new tag
    tags.push({ name, ...resolvedMetadata });
    setTagsMetadata(context.program, entity, tags);
  }
};

export { getTagsMetadata };

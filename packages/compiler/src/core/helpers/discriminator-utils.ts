import type { DiscriminatedOptions } from "../../../generated-defs/TypeSpec.js";
import { resolveEncodedEnumMemberValue } from "../../lib/encoded-names.js";
import { DuplicateTracker } from "../../utils/duplicate-tracker.js";
import { isDefined } from "../../utils/misc.js";
import type { Discriminator } from "../intrinsic-type-state.js";
import { getDiscriminatedOptions, getDiscriminatedTypes } from "../intrinsic-type-state.js";
import { createDiagnostic } from "../messages.js";
import type { Program } from "../program.js";
import { isTemplateDeclarationOrInstance } from "../type-utils.js";
import type { Diagnostic, EnumMember, Model, Type, Union } from "../types.js";

export interface DiscriminatedUnion {
  readonly options: Required<DiscriminatedOptions>;
  readonly variants: Map<string, Type>;
  readonly defaultVariant?: Type;
  readonly type: Union;
}

export interface DiscriminatedUnionLegacy {
  kind: "legacy";
  propertyName: string;
  variants: Map<string, Model>;
}

export function getDiscriminatedUnion(
  typeOrProgram: Program,
  typeOrDiscriminator: Union,
): [DiscriminatedUnion | undefined, readonly Diagnostic[]] {
  return getDiscriminatedUnionForUnion(typeOrProgram, typeOrDiscriminator);
}

/**
 * Run the validation on all discriminated models to make sure the discriminator are valid.
 * This has to be done after the checker so we can have the full picture of all the dervied models.
 */
export function validateInheritanceDiscriminatedUnions(program: Program) {
  for (const [type, discriminator] of getDiscriminatedTypes(program)) {
    // Union would have already reported the issue.
    if (type.kind === "Model") {
      const [_, diagnostics] = getDiscriminatedUnionFromInheritance(program, type, discriminator);
      program.reportDiagnostics(diagnostics);
    }
  }
}

function getDiscriminatedUnionForUnion(
  program: Program,
  type: Union,
): [DiscriminatedUnion | undefined, readonly Diagnostic[]] {
  const options = getDiscriminatedOptions(program, type);
  const diagnostics: Diagnostic[] = [];
  if (options === undefined) {
    return [undefined, []];
  }
  const variants = new Map<string, Type>();
  let defaultVariant;

  // If there is not envelope then every variant needs to be a model.
  for (const variant of type.variants.values()) {
    if (typeof variant.name !== "string") {
      if (defaultVariant) {
        diagnostics.push(
          createDiagnostic({
            code: "invalid-discriminated-union-variant",
            messageId: "duplicateDefaultVariant",
            format: { unionName: type.name ?? "(anonymous)" },
            target: variant,
          }),
        );
      } else {
        defaultVariant = variant.type;
      }
      continue;
    }
    variants.set(variant.name, variant.type);
    if (options.envelope === "none") {
      if (variant.type.kind !== "Model") {
        diagnostics.push(
          createDiagnostic({
            code: "invalid-discriminated-union-variant",
            messageId: "noEnvelopeModel",
            format: { name: variant.name.toString() },
            target: variant,
          }),
        );
        continue;
      }

      const prop = variant.type.properties.get(options.discriminatorPropertyName);
      if (prop !== undefined) {
        const key = getStringValue(program, prop.type);
        if (key !== variant.name) {
          diagnostics.push(
            createDiagnostic({
              code: "invalid-discriminated-union-variant",
              messageId: "discriminantMismatch",
              format: {
                name: variant.name.toString(),
                discriminant: options.discriminatorPropertyName,
                propertyValue: key!,
                variantName: String(variant.name),
              },
              target: variant.type,
            }),
          );
        }
      }
    }
  }

  return [
    {
      type,
      options,
      variants,
      defaultVariant,
    },
    diagnostics,
  ];
}

/**
 * Resolve the discriminated union formed by the models derived from the given model.
 * @param type Base model with the discriminator
 * @param discriminator Discriminator of the base model
 * @deprecated Use `getDiscriminatedUnionFromInheritance(program, type, discriminator)` instead. Without the program, enum member discriminator values ignore `@encodedName`.
 */
export function getDiscriminatedUnionFromInheritance(
  type: Model,
  discriminator: Discriminator,
): [DiscriminatedUnionLegacy, readonly Diagnostic[]];
/**
 * Resolve the discriminated union formed by the models derived from the given model.
 * @param program Program
 * @param type Base model with the discriminator
 * @param discriminator Discriminator of the base model
 */
export function getDiscriminatedUnionFromInheritance(
  program: Program,
  type: Model,
  discriminator: Discriminator,
): [DiscriminatedUnionLegacy, readonly Diagnostic[]];
export function getDiscriminatedUnionFromInheritance(
  programOrType: Program | Model,
  typeOrDiscriminator: Model | Discriminator,
  discriminator?: Discriminator,
): [DiscriminatedUnionLegacy, readonly Diagnostic[]] {
  if (discriminator === undefined) {
    return getDiscriminatedUnionFromInheritanceInternal(
      undefined,
      programOrType as Model,
      typeOrDiscriminator as Discriminator,
    );
  }
  return getDiscriminatedUnionFromInheritanceInternal(
    programOrType as Program,
    typeOrDiscriminator as Model,
    discriminator,
  );
}

function getDiscriminatedUnionFromInheritanceInternal(
  program: Program | undefined,
  type: Model,
  discriminator: Discriminator,
): [DiscriminatedUnionLegacy, readonly Diagnostic[]] {
  const variants = new Map<string, Model>();
  const diagnostics: Diagnostic[] = [];
  const duplicates = new DuplicateTracker<string, Model>();

  function checkForVariantsIn(current: Model) {
    for (const derivedModel of current.derivedModels) {
      if (isTemplateDeclarationOrInstance(derivedModel)) {
        continue; // Skip template instances as they should be used with `model is`
      }
      const keys = getDiscriminatorValues(program, derivedModel, discriminator, diagnostics);
      if (keys === undefined) {
        if (derivedModel.derivedModels.length === 0) {
          diagnostics.push(
            createDiagnostic({
              code: "missing-discriminator-property",
              format: { discriminator: discriminator.propertyName },
              target: derivedModel,
            }),
          );
        } else {
          checkForVariantsIn(derivedModel);
        }
      } else {
        for (const key of keys) {
          duplicates.track(key, derivedModel);
          variants.set(key, derivedModel);
        }
      }
    }
  }

  checkForVariantsIn(type);
  reportDuplicateDiscriminatorValues(duplicates, diagnostics);
  const discriminatedUnion: DiscriminatedUnionLegacy = {
    kind: "legacy",
    propertyName: discriminator.propertyName,
    variants,
  };

  return [discriminatedUnion, diagnostics];
}

function reportDuplicateDiscriminatorValues(
  duplicates: DuplicateTracker<string, Model>,
  diagnostics: Diagnostic[],
) {
  for (const [duplicateKey, models] of duplicates.entries()) {
    for (const model of models) {
      diagnostics.push(
        createDiagnostic({
          code: "invalid-discriminator-value",
          messageId: "duplicate",
          format: { discriminator: duplicateKey },
          target: model,
        }),
      );
    }
  }
}

function getDiscriminatorProperty(
  model: Model,
  discriminator: Discriminator,
  diagnostics: Diagnostic[],
) {
  const prop = model.properties.get(discriminator.propertyName);
  if (prop && prop.optional) {
    diagnostics.push(
      createDiagnostic({
        code: "invalid-discriminator-value",
        messageId: "required",
        target: prop,
      }),
    );
  }
  return prop;
}

function getDiscriminatorValues(
  program: Program | undefined,
  model: Model,
  discriminator: Discriminator,
  diagnostics: Diagnostic[],
): string[] | undefined {
  const prop = getDiscriminatorProperty(model, discriminator, diagnostics);
  if (!prop) return undefined;

  const keys = getStringValues(program, prop.type);
  if (keys.length === 0) {
    diagnostics.push(
      createDiagnostic({
        code: "invalid-discriminator-value",
        format: { kind: prop.type.kind },
        target: prop,
      }),
    );
  }
  return keys;
}

function getStringValues(program: Program | undefined, type: Type): string[] {
  switch (type.kind) {
    case "String":
      return [type.value];
    case "Union":
      return [...type.variants.values()]
        .flatMap((x) => getStringValues(program, x.type))
        .filter(isDefined);
    case "EnumMember": {
      const value = resolveEnumMemberValue(program, type);
      return typeof value === "string" ? [value] : [];
    }
    case "UnionVariant":
      return getStringValues(program, type.type);
    default:
      return [];
  }
}

function getStringValue(program: Program, type: Type): string | undefined {
  switch (type.kind) {
    case "String":
      return type.value;
    case "EnumMember":
      const value = resolveEnumMemberValue(program, type);
      return typeof value === "string" ? value : undefined;
    default:
      return undefined;
  }
}

/** Value an enum member is serialized as in json. */
function resolveEnumMemberValue(program: Program | undefined, member: EnumMember): string | number {
  return program
    ? resolveEncodedEnumMemberValue(program, member, "application/json")
    : (member.value ?? member.name);
}

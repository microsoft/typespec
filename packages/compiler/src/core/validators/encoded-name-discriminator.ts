import { getEncodedNames } from "../../lib/encoded-names.js";
import { Discriminator, getDiscriminatedTypes } from "../intrinsic-type-state.js";
import { reportDiagnostic } from "../messages.js";
import type { Program } from "../program.js";
import { Model } from "../types.js";

/**
 * Validate you do not use `@encodedName` on a discriminator property.
 */
export function validateIncompatibleEncodedNameAndDiscriminator(program: Program) {
  for (const [type, discriminator] of getDiscriminatedTypes(program)) {
    if (type.kind === "Model") {
      validateModel(program, type, discriminator);
      for (const child of type.derivedModels) {
        validateModel(program, child, discriminator);
      }
    } else {
      for (const variant of type.variants.values()) {
        if (variant.type.kind === "Model") {
          validateModel(program, variant.type, discriminator);
        }
      }
    }
  }
}

function validateModel(program: Program, type: Model, discriminator: Discriminator) {
  const property = type.properties.get(discriminator.propertyName);
  const names = property && getEncodedNames(program, property);
  if (names && names?.size > 0) {
    reportDiagnostic(program, {
      code: "discriminator-encodedname",
      target: type,
      format: { discriminator: discriminator.propertyName },
    });
  }
}

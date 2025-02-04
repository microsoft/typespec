import { Model, ModelProperty } from "../../../core/index.js";
import { defineKit } from "../define-kit.js";

/**
 * Information about the transformation that produced a model.
 */
export interface TransformInfo {
  /**
   * The immediate source model of the transform. The transform may result from
   * a series of transforms, in which case this property will be the model that
   * immediately preceded the given model in the transformation chain.
   */
  source: Model;
  /**
   * The ultimate source model of the transform, i.e. the original untransformed
   * model that ultimately produced the given model. This may be the same as the
   * `source` property if the model is the result of a single transform.
   */
  original: Model;
  /**
   * The template that was used to produce the model, if any.
   *
   * If this property is present, the model is an uninstantiated template.
   */
  instanceOf?: Model;
}

/**
 * A predicate for determining if a property can be shared between models.
 *
 * For example, in OpenAPI, a property can be shared if the same schema can represent its visibility in the same model
 * (e.g. `readOnly`, `writeOnly`).
 *
 * @param transformedProperty - The property in the transformed model.
 * @param originalProperty - The property in the original model.
 *
 * @returns `true` if the property can be shared, `false` otherwise.
 */
export type CanShareProperty = (
  transformedProperty: ModelProperty,
  originalProperty: ModelProperty,
) => boolean;

/**
 * Utilities for working with visibilities.
 * @experimental
 */
export interface VisibilityKit {
  /**
   * Gets the visibility transform information for the given model, if it is the result of a transform.
   *
   * @param model - The model to get the transform source for.
   */
  getTransformInfo(model: Model): TransformInfo | undefined;

  /**
   * Determines if a model is "emptied" by a visibility transform.
   *
   * This will be true if the model has no properties and it is a transform of a model that has properties.
   */
  isEmptied(model: Model): boolean;

  /**
   * Determines if a property is present in a given lifecycle phase.
   *
   * This is equivalent to checking if the property is visible using a visibility filter with `any` of the given
   * visibilities set in the lifecycle `phase`.
   */
  isVisibleInLifecyclePhase(property: ModelProperty, phase: LifecyclePhase): boolean;

  /**
   * Finds a model in the chain of transform sources that can serve as a canonical representation of this model.
   *
   * This method will attempt to find an ancestor transform source that can share every property with the given model.
   *
   * @param model - The model to canonicalize.
   * @param canShareProperty - A predicate that determines if a property can be shared between models.
   */
  canonicalize(model: Model, canShareProperty: CanShareProperty): Model;
}

/**
 * The lifecycle phase of a visibility transform.
 */
export enum LifecyclePhase {
  /**
   * The transform for when a resource is read.
   */
  Read = 1,
  /**
   * The transform for when a resource is created.
   */
  Create = 1 << 1,
  /**
   * The transform for when a resource is updated by replacement.
   */
  Update = 1 << 2,
  /**
   * The transform for when a resource is passed as an input to an operation that does not otherwise create, read,
   * update, or delete it.
   */
  Query = 1 << 3,
  /**
   * The transform for when a resource is deleted.
   *
   * Note: ordinarily, most operations that delete resources do not consume the resource as a parameter, but in cases
   * where they do, this lifecycle phase can be used to include only properties that are visible in the deletion phase.
   */
  Delete = 1 << 4,

  /**
   * The transform for when a resource is created or updated.
   */
  CreateOrUpdate = LifecyclePhase.Create | LifecyclePhase.Update,
}

/**
 * Defines the recursion relationship between lifecycle phases.
 *
 * If the phase is an update phase, when recurring into nested models it should also include the create phase.
 *
 * @param phase - the input lifecycle phase
 * @returns the next phase to apply when recurring into nested models
 */
function getLifecyclePhaseRecursion(phase: LifecyclePhase): LifecyclePhase {
  if (phase & LifecyclePhase.Update) {
    return phase | LifecyclePhase.Create;
  } else {
    return phase;
  }
}

export const VisibilityKit = defineKit<VisibilityExtension>({
  visibility: {
    getTransformInfo(model) {
      throw new Error("Not implemented");
    },

    isEmptied(model) {
      if (model.properties.size > 0 || model.indexer !== undefined) {
        return false;
      }

      const transformInfo = this.visibility.getTransformInfo(model);

      if (transformInfo) {
        return transformInfo.source.properties.size > 0;
      } else {
        return false;
      }
    },

    isVisibleInLifecyclePhase(property, phase) {
      throw new Error("Not implemented");
    },

    canonicalize(model, canShareProperty) {
      throw new Error("Not implemented");
    },
  },
});

interface VisibilityExtension {
  /**
   * Utilities for working with visibilities.
   * @experimental
   */
  visibility: VisibilityKit;
}

declare module "../define-kit.js" {
  interface Typekit extends VisibilityExtension {}
}

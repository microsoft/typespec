import type { Model } from "@typespec/compiler";
import { defineKit } from "@typespec/compiler/typekit";
import { isHttpFile } from "../../../private.decorators.js";

/**
 * Utilities for working with Models in the context of Http.
 * @typekit model
 * @experimental
 */
export interface HttpModel {
  /**
   * Check if a model is an Http file.
   * @param model model to check
   */
  isHttpFile(model: Model): boolean;
}

interface TypekitExtension {
  model: HttpModel;
}

declare module "@typespec/compiler/typekit" {
  interface ModelKit extends HttpModel {}
}

defineKit<TypekitExtension>({
  model: {
    isHttpFile(model: Model) {
      return isHttpFile(this.program, model);
    },
  },
});

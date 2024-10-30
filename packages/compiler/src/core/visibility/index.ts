// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

export { getLifecycleVisibilityEnum } from "./lifecycle.js";

export {
  addVisibilityModifiers,
  removeVisibilityModifiers,
  clearVisibilityModifiersForClass,
  resetVisibilityModifiersForClass,
  sealVisibilityModifiers,
  sealVisibilityModifiersForProgram,
  isSealed,
  getVisibility,
  getVisibilityForClass,
  hasVisibility,
  isVisible,
} from "./core.js";

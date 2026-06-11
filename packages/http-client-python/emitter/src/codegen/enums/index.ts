// -------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for
// license information.
// --------------------------------------------------------------------------

export { renderEnumFile } from "./handlebars.js";
export type { RenderEnumFileOptions } from "./handlebars.js";
export { UnsupportedEnumError, collectEnumGroups } from "./render.js";
export type { EnumGroup, EnumValueView, EnumView } from "./render.js";
export { renderEnumFiles, replaceEnumFiles } from "./replace.js";
export type { RenderedEnumFile } from "./replace.js";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

/**
 * Constants for the supported client option names used with the @clientOption decorator.
 * @internal
 */
export const ClientOptions = {
  /** Controls whether the root slash is included in the operation path. */
  includeRootSlash: "includeRootSlash",
  /** Sets a prefix for collection header parameters. */
  collectionHeaderPrefix: "collectionHeaderPrefix",
} as const;

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { getEffectiveApiVersionOverride } from "@azure-tools/typespec-azure-core";
import type {
  DecoratorInfo,
  SdkClientType,
  SdkHttpOperation,
} from "@azure-tools/typespec-client-generator-core";
import type { Operation, Program } from "@typespec/compiler";

const overrideDecorator = "Azure.Core.Legacy.@overrideApiVersion";

export function getOperationApiVersionOverride(
  program: Program,
  operation: Operation | undefined,
): string | undefined {
  while (operation) {
    const version = getEffectiveApiVersionOverride(program, operation);
    if (version !== undefined) {
      return version;
    }
    operation = operation.sourceOperation;
  }
  return undefined;
}

export function getClientApiVersionOverride(
  program: Program,
  client: SdkClientType<SdkHttpOperation>,
): string | undefined {
  const declaration =
    client.__raw.type ??
    (client.__raw.services.length === 1 ? client.__raw.services[0] : undefined);
  const version = declaration && getEffectiveApiVersionOverride(program, declaration);
  if (version !== undefined) {
    return version;
  }

  // Relocated operations can carry overrides absent from the client's declaring namespace.
  // Only promote a common override; mixed clients retain per-operation metadata.
  const versions = client.methods.map((method) =>
    getOperationApiVersionOverride(program, method.operation.__raw.operation),
  );
  const commonVersion = versions[0];
  return commonVersion !== undefined && versions.every((v) => v === commonVersion)
    ? commonVersion
    : undefined;
}

export function withApiVersionOverride(
  decorators: DecoratorInfo[] | undefined,
  version: string | undefined,
): DecoratorInfo[] | undefined {
  if (version === undefined) {
    return decorators;
  }
  return [
    ...(decorators ?? []).filter((d) => d.name !== overrideDecorator),
    { name: overrideDecorator, arguments: { version } },
  ];
}

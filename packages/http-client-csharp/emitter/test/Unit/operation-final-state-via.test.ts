// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.
import { FinalStateValue } from "@azure-tools/typespec-azure-core";
import assert from "assert";
import { describe, it } from "vitest";
import {
  OperationFinalStateVia,
  convertLroFinalStateVia,
} from "../../src/type/operation-final-state-via.js";

describe("convertLroFinalStateVia()", () => {
  describe("normal inputs", () => {
    const mappings: [FinalStateValue, OperationFinalStateVia][] = [
      [FinalStateValue.azureAsyncOperation, OperationFinalStateVia.AzureAsyncOperation],
      [FinalStateValue.location, OperationFinalStateVia.Location],
      [FinalStateValue.originalUri, OperationFinalStateVia.OriginalUri],
      [FinalStateValue.operationLocation, OperationFinalStateVia.OperationLocation],
    ];
    for (const [input, output] of mappings) {
      it(`should return '${output}' for '${input}'`, function () {
        assert.equal(convertLroFinalStateVia(input), output);
      });
    }
  });

  describe("unsupported inputs", () => {
    const unsupportedInputs = [FinalStateValue.customLink];
    for (const input of unsupportedInputs) {
      it(`should throw exception for unsupported input '${input}'`, function () {
        assert.throws(
          () => convertLroFinalStateVia(input),
          new RegExp(`Unsupported LRO final state value: ${input}`),
        );
      });
    }
  });
});

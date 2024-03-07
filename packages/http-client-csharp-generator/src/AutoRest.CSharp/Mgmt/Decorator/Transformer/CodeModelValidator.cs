// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Mgmt.AutoRest;

namespace AutoRest.CSharp.Mgmt.Decorator.Transformer
{
    internal static class CodeModelValidator
    {
        public static void Validate()
        {
            VerifyApiVersions();
        }

        private static void VerifyApiVersions()
        {
            foreach (var operationGroup in MgmtContext.CodeModel.OperationGroups)
            {
                VerifyApiVersionsWithinOperationGroup(operationGroup);
            }
        }

        // Operations within an operation group should use the same API version.
        // TODO: this might be able to be removed after https://github.com/Azure/autorest.csharp/issues/1917 is resolved.
        private static void VerifyApiVersionsWithinOperationGroup(OperationGroup operationGroup)
        {
            var apiVersionValues = operationGroup.Operations
                .SelectMany(op => op.Parameters.Where(p => p.Origin == "modelerfour:synthesized/api-version").Select(p => ((ConstantSchema)p.Schema).Value.Value))
                .ToHashSet();
            if (apiVersionValues.Count > 1)
            {
                throw new InvalidOperationException($"Multiple api-version values found in the operation group: {operationGroup.Key}. Please rename the operation group for some operations so that all operations in one operation group share the same API version.");
            }
        }
    }
}

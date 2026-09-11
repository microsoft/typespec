// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Utilities
{
    internal static class ExperimentalApiHelpers
    {
        private const string DependencySuppressionJustification =
            "This method depends on experimental functionality.";

        public static IReadOnlyList<AttributeStatement> BuildAttributes(InputOperation operation)
        {
            var diagnosticId = operation.Experimental?.DiagnosticId;
            return string.IsNullOrWhiteSpace(diagnosticId)
                ? []
                : [new AttributeStatement(typeof(ExperimentalAttribute), [Literal(diagnosticId)])];
        }

        public static void AddDependencySuppressions(MethodProvider method, InputOperation operation)
        {
            var dependencies = operation.Experimental?.DependsOn;
            if (dependencies is null || dependencies.Count == 0)
            {
                return;
            }

            method.Update(suppressions:
            [
                .. dependencies
                    .Where(diagnosticId => !string.IsNullOrWhiteSpace(diagnosticId))
                    .Distinct(StringComparer.Ordinal)
                    .Select(diagnosticId => new SuppressionStatement(
                        null,
                        Literal(diagnosticId),
                        DependencySuppressionJustification)),
                .. method.Suppressions
            ]);
        }
    }
}

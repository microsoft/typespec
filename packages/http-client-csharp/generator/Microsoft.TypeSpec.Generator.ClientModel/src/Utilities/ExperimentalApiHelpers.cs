// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
        public static AttributeStatement? BuildAttribute(InputOperation operation)
            => operation.Experimental?.DiagnosticId is { } diagnosticId
                ? new AttributeStatement(typeof(ExperimentalAttribute), [Literal(diagnosticId)])
                : null;

        public static void AddDependencySuppressions(MethodProvider method, InputOperation operation)
        {
            if (operation.Experimental?.DependsOn is not { Count: > 0 } dependencies)
            {
                return;
            }

            // An empty #pragma warning disable would suppress every diagnostic.
            if (dependencies.Any(string.IsNullOrWhiteSpace))
            {
                throw new ArgumentException("Experimental dependency diagnostic identifiers cannot be empty or whitespace.", nameof(operation));
            }

            method.Update(suppressions:
            [
                .. method.Suppressions,
                .. dependencies.Distinct(StringComparer.Ordinal)
                    .Select(id => new SuppressionStatement(null, Literal(id), "This method depends on experimental functionality."))
            ]);
        }
    }
}

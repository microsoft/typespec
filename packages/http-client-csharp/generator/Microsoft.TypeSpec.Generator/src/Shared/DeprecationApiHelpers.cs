// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal static class DeprecationApiHelpers
    {
        public static bool IsObsoleteAttribute(AttributeStatement attribute)
            => attribute.Type.Equals(typeof(ObsoleteAttribute));

        public static AttributeStatement? BuildAttribute(string? message)
            => message is null ? null : new AttributeStatement(typeof(ObsoleteAttribute), [Literal(message)]);

        public static string? GetDiagnosticId(AttributeStatement attribute)
        {
            var value = attribute.PositionalArguments.FirstOrDefault(argument => argument.Key == nameof(ObsoleteAttribute.DiagnosticId)).Value;
            while (value is ScopedApi scoped)
            {
                value = scoped.Original;
            }
            if (value is null or LiteralExpression { Literal: null or "" } or KeywordExpression { Keyword: "null" })
            {
                return null;
            }
            if (value is not LiteralExpression { Literal: string diagnosticId })
            {
                throw new InvalidOperationException("Obsolete diagnostic IDs must be constant strings.");
            }
            ExperimentalApiHelpers.ValidateDiagnosticId(diagnosticId);
            return diagnosticId;
        }

        public static SuppressionStatement[] GetSuppressions(AttributeStatement? attribute = null)
            => attribute is not null && GetDiagnosticId(attribute) is { } diagnosticId
                ? [new(null, Literal(diagnosticId), "This generated code references obsolete functionality.")]
                :
                [
                    new(null, Literal("CS0612"), "This generated code references obsolete functionality."),
                    new(null, Literal("CS0618"), "This generated code references obsolete functionality.")
                ];
    }
}

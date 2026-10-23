// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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

        public static SuppressionStatement[] GetSuppressions()
            =>
            [
                new(null, Literal("CS0612"), "This generated code references obsolete functionality."),
                new(null, Literal("CS0618"), "This generated code references obsolete functionality.")
            ];
    }
}

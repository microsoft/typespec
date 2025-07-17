// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public record TypeOfExpression(CSharpType Type) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            // Explicitly ensure the namespace is added to the using statements
            if (!string.IsNullOrEmpty(Type.Namespace))
            {
                writer.UseNamespace(Type.Namespace);
            }
            writer.Append($"typeof({Type})");
        }
    }
}

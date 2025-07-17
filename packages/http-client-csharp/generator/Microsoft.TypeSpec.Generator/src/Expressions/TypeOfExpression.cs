// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public record TypeOfExpression(CSharpType Type) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.Append($"typeof({Type})");
        }
    }
}

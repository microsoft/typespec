// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Primitives;

namespace TypeSpec.Generator.Expressions
{
    public record TypeOfExpression(CSharpType Type) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.Append($"typeof({Type})");
        }
    }
}

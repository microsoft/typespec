// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a cast expression.
    /// </summary>
    /// <param name="Inner">The inner value expression that is being casted.</param>
    /// <param name="Type">The type to cast to.</param>
    public sealed record CastExpression(ValueExpression Inner, CSharpType Type) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            // wrap the cast expression with parenthesis, so that it would not cause ambiguity for leading recursive calls
            // if the parenthesis are not needed, the roslyn reducer will remove it.
            writer.AppendRaw("(");
            writer.Append($"({Type})");
            Inner.Write(writer);
            writer.AppendRaw(")");
        }
    }
}

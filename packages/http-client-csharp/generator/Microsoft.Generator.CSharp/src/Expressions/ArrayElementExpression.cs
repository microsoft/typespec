// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents an array element expression.
    /// </summary>
    /// <param name="Array">The array.</param>
    /// <param name="Index">The index of the element in the array.</param>
    public sealed record ArrayElementExpression(ValueExpression Array, ValueExpression Index) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            Array.Write(writer);
            writer.AppendRaw("[");
            Index.Write(writer);
            writer.AppendRaw("]");
        }
    }
}

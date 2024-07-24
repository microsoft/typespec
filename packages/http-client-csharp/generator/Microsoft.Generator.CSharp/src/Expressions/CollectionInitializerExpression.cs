// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents a collection initializer expression.
    /// </summary>
    /// <param name="Items">The items to set during collection initialization.</param>
    public sealed record CollectionInitializerExpression(params ValueExpression[] Items) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("{ ");
            for (int i = 0; i < Items.Length; i++)
            {
                Items[i].Write(writer);
                if (i < Items.Length - 1)
                    writer.AppendRaw(", ");
            }
            writer.AppendRaw(" }");
        }
    }
}

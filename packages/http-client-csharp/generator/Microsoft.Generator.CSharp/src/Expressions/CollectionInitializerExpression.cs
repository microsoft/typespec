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
        public override void Write(CodeWriter writer)
        {
            writer.AppendRaw("{ ");
            foreach (var item in Items)
            {
                item.Write(writer);
                writer.AppendRaw(",");
            }

            writer.RemoveTrailingComma();
            writer.AppendRaw(" }");
        }
    }
}

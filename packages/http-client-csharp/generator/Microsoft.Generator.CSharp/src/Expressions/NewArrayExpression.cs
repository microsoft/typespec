// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record NewArrayExpression(CSharpType? Type, ArrayInitializerExpression? Items = null, ValueExpression? Size = null) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            if (Size is not null)
            {
                if (Type is null)
                {
                    writer.AppendRaw("new[");
                }
                else
                {
                    writer.Append($"new {Type}[");
                }

                Size.Write(writer);
                writer.AppendRaw("]");
                return;
            }

            if (Items is { Elements.Count: > 0 })
            {
                if (Type is null)
                {
                    writer.AppendRaw("new[]");
                }
                else
                {
                    writer.Append($"new {Type}[]");
                }

                Items.Write(writer);
            }
            else if (Type is null)
            {
                writer.AppendRaw("new[]{}");
            }
            else
            {
                writer.Append($"Array.Empty<{Type}>()");
            }
        }
    }
}

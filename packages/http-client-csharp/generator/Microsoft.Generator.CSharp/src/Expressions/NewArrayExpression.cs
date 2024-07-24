// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record NewArrayExpression(CSharpType? Type, ArrayInitializerExpression? Items = null, ValueExpression? Size = null, bool IsStackAlloc = false) : ValueExpression
    {
        private const string StackAllocKeyword = "stackalloc";
        private const string NewKeyword = "new";

        internal override void Write(CodeWriter writer)
        {
            var newStr = IsStackAlloc ? StackAllocKeyword : NewKeyword;

            if (Size is not null)
            {
                if (Type is null)
                {
                    writer.AppendRaw($"{newStr} [");
                }
                else
                {
                    writer.Append($"{newStr} {Type}[");
                }

                Size.Write(writer);
                writer.AppendRaw("]");
                return;
            }

            if (Items is { Elements.Count: > 0 })
            {
                if (Type is null)
                {
                    writer.AppendRaw($"{newStr} [] ");
                }
                else
                {
                    writer.Append($"{newStr} {Type}[] ");
                }

                Items.Write(writer);
            }
            else if (Type is null)
            {
                writer.AppendRaw($"{newStr} [] {{ }}");
            }
            else
            {
                writer.Append($"Array.Empty<{Type}>()");
            }
        }
    }
}

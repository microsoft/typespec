// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents an array initializer expression.
    /// </summary>
    /// <param name="Elements">The elements to initialize the array to.</param>
    /// <param name="IsInline">Flag to determine if the array should be initialized inline.</param>
    public sealed record ArrayInitializerExpression(IReadOnlyList<ValueExpression>? Elements = null, bool IsInline = true) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            if (Elements is not { Count: > 0 })
            {
                writer.AppendRaw("{}");
                return;
            }

            if (IsInline)
            {
                writer.AppendRaw("{");
                foreach (var item in Elements)
                {
                    item.Write(writer);
                    writer.AppendRaw(", ");
                }

                writer.RemoveTrailingComma();
                writer.AppendRaw("}");
            }
            else
            {
                writer.WriteLine();
                writer.WriteRawLine("{");
                foreach (var item in Elements)
                {
                    item.Write(writer);
                    writer.WriteRawLine(",");
                }

                writer.RemoveTrailingComma();
                writer.WriteLine();
                writer.AppendRaw("}");
            }
        }
    }
}

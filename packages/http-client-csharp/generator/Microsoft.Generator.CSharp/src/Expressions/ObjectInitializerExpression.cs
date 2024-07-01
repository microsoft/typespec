// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    /// <summary>
    /// Represents an object initializer expression.
    /// </summary>
    /// <param name="Values">The set of property values to initialize the object to.</param>
    /// <param name="UseSingleLine">Flag to determine if the object should be initialized inline.</param>
    public record ObjectInitializerExpression(IReadOnlyDictionary<ValueExpression, ValueExpression> Values, bool UseSingleLine = false) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            var iterator = Values.GetEnumerator();
            if (!iterator.MoveNext())
            {
                writer.AppendRaw("{ }");
                return;
            }

            if (UseSingleLine)
            {
                writer.AppendRaw("{ ");
                WriteItem(writer, iterator.Current);
                while (iterator.MoveNext())
                {
                    writer.AppendRaw(", ");
                    WriteItem(writer, iterator.Current);
                }
                writer.AppendRaw(" }");
            }
            else
            {
                using var scope = writer.Scope();
                WriteItem(writer, iterator.Current);
                while (iterator.MoveNext())
                {
                    writer.WriteRawLine(",");
                    WriteItem(writer, iterator.Current);
                }
                writer.WriteLine();
            }
        }

        private static void WriteItem(CodeWriter writer, KeyValuePair<ValueExpression, ValueExpression> item)
        {
            writer.Append($"{item.Key} = ");
            item.Value.Write(writer);
        }
    }
}

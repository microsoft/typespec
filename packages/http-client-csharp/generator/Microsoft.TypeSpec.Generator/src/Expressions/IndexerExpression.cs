// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record IndexerExpression(ValueExpression? Inner, ValueExpression? Index) : ValueExpression
    {
        public ValueExpression[]? Elements { get; private init; }

        public static IndexerExpression FromCollection(params ValueExpression[] elements)
        {
            return new IndexerExpression(null, null) { Elements = elements };
        }
        internal override void Write(CodeWriter writer)
        {
            if (Inner is not null)
            {
                Inner.Write(writer);
            }
            writer.AppendRaw("[");
            Index?.Write(writer);
            if (Elements != null)
            {
                for (int i = 0; i < Elements.Length; i++)
                {
                    if (i > 0)
                    {
                        writer.AppendRaw(", ");
                    }

                    Elements[i].Write(writer);
                }
            }

            writer.AppendRaw("]");
        }
    }
}

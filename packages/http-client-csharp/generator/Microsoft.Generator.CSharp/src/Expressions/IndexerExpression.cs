// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record IndexerExpression(ValueExpression? Inner, ValueExpression Index) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            if (Inner is not null)
            {
                Inner.Write(writer);
            }
            writer.AppendRaw("[");
            Index.Write(writer);
            writer.AppendRaw("]");
        }
    }
}

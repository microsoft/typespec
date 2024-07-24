// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record AsExpression(ValueExpression Inner, CSharpType Type) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            Inner.Write(writer);
            writer.Append($" as {Type}");
        }
    }
}

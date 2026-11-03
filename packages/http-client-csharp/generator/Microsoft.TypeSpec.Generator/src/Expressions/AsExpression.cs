// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record AsExpression(ValueExpression Inner, CSharpType Type) : ValueExpression
    {
        internal override void WriteCore(CodeWriter writer)
        {
            Inner.Write(writer);
            writer.Append($" as {Type}");
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record NullConditionalExpression(ValueExpression Inner) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            Inner.Write(writer);
            writer.AppendRaw("?");
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ConstantExpression(Constant Constant) : TypedValueExpression(Constant.Type, new UntypedConstantExpression(Constant))
    {
        private record UntypedConstantExpression(Constant Constant) : ValueExpression
        {
            public override void Write(CodeWriter writer) => writer.Append(Constant.GetConstantFormattable());
        }
    }
}

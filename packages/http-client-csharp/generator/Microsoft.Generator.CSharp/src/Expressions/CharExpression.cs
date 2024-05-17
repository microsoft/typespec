// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record CharExpression(ValueExpression Untyped) : TypedValueExpression<char>(Untyped)
    {
        public StringExpression InvokeToString(ValueExpression cultureInfo) => new(Invoke(nameof(char.ToString), cultureInfo));
    }
}

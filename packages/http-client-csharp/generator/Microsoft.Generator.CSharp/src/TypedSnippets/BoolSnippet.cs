// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record BoolSnippet(ValueExpression Expression) : TypedSnippet<bool>(Expression)
    {
        public BoolSnippet Or(ValueExpression other) => new(new BinaryOperatorExpression("||", this, other));

        public BoolSnippet And(ValueExpression other) => new(new BinaryOperatorExpression("&&", this, other));
    }
}

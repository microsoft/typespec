// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record BoolSnippet(ValueExpression Untyped) : TypedSnippet<bool>(Untyped)
    {
        public BoolSnippet Or(ValueExpression other) => new(new BinaryOperatorExpression("||", this, other));

        public BoolSnippet And(ValueExpression other) => new(new BinaryOperatorExpression("&&", this, other));

        public static BoolSnippet True { get; } = Snippet.True;

        public static BoolSnippet False { get; } = Snippet.False;

        public static BoolSnippet Is(ValueExpression untyped, CSharpType comparisonType) => new(new BinaryOperatorExpression("is", untyped, comparisonType));

        public static BoolSnippet Is(ValueExpression untyped, DeclarationExpression declaration) => new(new BinaryOperatorExpression("is", untyped, declaration));
    }
}

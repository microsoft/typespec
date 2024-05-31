// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record IntSnippet(ValueExpression Untyped) : TypedSnippet<int>(Untyped)
    {
        public static IntSnippet MaxValue => new(StaticProperty(nameof(int.MaxValue)));
        public IntSnippet Add(IntSnippet value) => Operator("+", value);
        public IntSnippet Minus(IntSnippet value) => Operator("-", value);
        public IntSnippet Multiply(IntSnippet value) => Operator("*", value);
        public IntSnippet DivideBy(IntSnippet value) => Operator("/", value);

        public static IntSnippet operator +(IntSnippet left, IntSnippet right) => left.Add(right);
        public static IntSnippet operator -(IntSnippet left, IntSnippet right) => left.Minus(right);
        public static IntSnippet operator *(IntSnippet left, IntSnippet right) => left.Multiply(right);
        public static IntSnippet operator /(IntSnippet left, IntSnippet right) => left.DivideBy(right);

        private IntSnippet Operator(string op, IntSnippet other) => new(new BinaryOperatorExpression(op, this, other));
    }
}

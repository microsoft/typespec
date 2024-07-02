// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record StringBuilderSnippet(ValueExpression Expression) : TypedSnippet<StringBuilder>(Expression)
    {
        public ScopedApi<int> Length => new(Property(nameof(StringBuilder.Length)));

        public StringBuilderSnippet Append(ScopedApi<string> value) => new(Expression.Invoke(nameof(StringBuilder.Append), value));

        public StringBuilderSnippet AppendLine(ScopedApi<string> value) => new(Expression.Invoke(nameof(StringBuilder.AppendLine), value));

        public StringBuilderSnippet Append(ValueExpression value) => new(Expression.Invoke(nameof(StringBuilder.Append), value));

        public StringBuilderSnippet AppendLine(ValueExpression value) => new(Expression.Invoke(nameof(StringBuilder.AppendLine), value));

        public StringBuilderSnippet Append(string value) => Append(Snippet.Literal(value));

        public StringBuilderSnippet AppendLine(string value) => AppendLine(Snippet.Literal(value));

        public StringBuilderSnippet Append(FormattableStringExpression value) => new(Expression.Invoke(nameof(StringBuilder.Append), value));

        public StringBuilderSnippet AppendLine(FormattableStringExpression value) => new(Expression.Invoke(nameof(StringBuilder.AppendLine), value));

        public StringBuilderSnippet Remove(ValueExpression startIndex, ValueExpression length) => new(Expression.Invoke(nameof(StringBuilder.Remove), [startIndex, length]));

        public ValueExpression this[ValueExpression index] => new IndexerExpression(this, index);
    }
}

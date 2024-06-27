// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record StringBuilderSnippet(ValueExpression Untyped) : TypedSnippet<StringBuilder>(Untyped)
    {
        public IntSnippet Length => new(Property(nameof(StringBuilder.Length)));

        public StringBuilderSnippet Append(StringSnippet value) => new(Untyped.Invoke(nameof(StringBuilder.Append), value));

        public StringBuilderSnippet AppendLine(StringSnippet value) => new(Untyped.Invoke(nameof(StringBuilder.AppendLine), value));

        public StringBuilderSnippet Append(ValueExpression value) => new(Untyped.Invoke(nameof(StringBuilder.Append), value));

        public StringBuilderSnippet AppendLine(ValueExpression value) => new(Untyped.Invoke(nameof(StringBuilder.AppendLine), value));

        public StringBuilderSnippet Append(string value) => Append(Snippet.Literal(value));

        public StringBuilderSnippet AppendLine(string value) => AppendLine(Snippet.Literal(value));

        public StringBuilderSnippet Append(FormattableStringExpression value) => new(Untyped.Invoke(nameof(StringBuilder.Append), value));

        public StringBuilderSnippet AppendLine(FormattableStringExpression value) => new(Untyped.Invoke(nameof(StringBuilder.AppendLine), value));

        public StringBuilderSnippet Remove(ValueExpression startIndex, ValueExpression length) => new(Untyped.Invoke(nameof(StringBuilder.Remove), [startIndex, length]));
    }
}

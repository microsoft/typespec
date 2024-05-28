// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record StringBuilderSnippet(ValueExpression Untyped) : TypedSnippet<StringBuilder>(Untyped)
    {
        public IntSnippet Length => new(Property(nameof(StringBuilder.Length)));

        public MethodBodyStatement Append(StringSnippet value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(StringSnippet value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);

        public MethodBodyStatement Append(ValueExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(ValueExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);

        public MethodBodyStatement Append(string value) => Append(Snippet.Literal(value));

        public MethodBodyStatement AppendLine(string value) => AppendLine(Snippet.Literal(value));

        public MethodBodyStatement Append(FormattableStringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(FormattableStringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);

        public MethodBodyStatement Remove(ValueExpression startIndex, ValueExpression length) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Remove), startIndex, length);
    }
}

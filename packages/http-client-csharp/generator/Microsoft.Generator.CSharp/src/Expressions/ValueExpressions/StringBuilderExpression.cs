// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record StringBuilderExpression(ValueExpression Untyped) : TypedValueExpression<StringBuilder>(Untyped), ITypedValueExpressionFactory<StringBuilderExpression>
    {
        public StringExpression Length => new(Property(nameof(StringBuilder.Length)));

        public MethodBodyStatement Append(StringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(StringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);

        public MethodBodyStatement Append(ValueExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(ValueExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);

        public MethodBodyStatement Append(string value) => Append(Snippets.Literal(value));

        public MethodBodyStatement AppendLine(string value) => AppendLine(Snippets.Literal(value));

        public MethodBodyStatement Append(FormattableStringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(FormattableStringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);

        static StringBuilderExpression ITypedValueExpressionFactory<StringBuilderExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}

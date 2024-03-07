// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record StringBuilderExpression(ValueExpression Untyped) : TypedValueExpression<StringBuilder>(Untyped)
    {
        public MethodBodyStatement Append(StringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(StringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);

        public MethodBodyStatement Append(ValueExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(ValueExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);

        public MethodBodyStatement Append(string value) => Append(Snippets.Literal(value));

        public MethodBodyStatement AppendLine(string value) => AppendLine(Snippets.Literal(value));

        public MethodBodyStatement Append(FormattableStringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.Append), value);

        public MethodBodyStatement AppendLine(FormattableStringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(StringBuilder.AppendLine), value);
    }
}

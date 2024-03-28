// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using Azure.Core;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record FormUrlEncodedContentExpression(ValueExpression Untyped) : TypedValueExpression<FormUrlEncodedContent>(Untyped)
    {
        public MethodBodyStatement Add(string name, StringExpression value)
            => new InvokeInstanceMethodStatement(Untyped, nameof(FormUrlEncodedContent.Add), Literal(name), value);
    }
}

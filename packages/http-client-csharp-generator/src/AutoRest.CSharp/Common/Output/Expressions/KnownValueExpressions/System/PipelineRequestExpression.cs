// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.System
{
    internal sealed record PipelineRequestExpression(ValueExpression Untyped) : TypedValueExpression<PipelineRequest>(Untyped)
    {
        public TypedValueExpression Uri => new FrameworkTypeExpression(typeof(Uri), Property(nameof(PipelineRequest.Uri)));
        public RequestBodyExpression Content => new(Property(nameof(PipelineRequest.Content)));
        public MethodBodyStatement SetMethod(string method) => new InvokeInstanceMethodStatement(Untyped, nameof(PipelineRequest.SetMethod), Literal(method));
        public MethodBodyStatement SetHeaderValue(string name, StringExpression value) => new InvokeInstanceMethodStatement(Untyped, nameof(PipelineRequest.SetHeaderValue), Literal(name), value);
    }
}

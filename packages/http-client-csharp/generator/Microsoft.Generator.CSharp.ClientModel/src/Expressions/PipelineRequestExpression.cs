// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal sealed record PipelineRequestExpression(ValueExpression Untyped) : TypedValueExpression<PipelineRequest>(Untyped)
    {
        public TypedValueExpression Uri => new FrameworkTypeExpression(typeof(Uri), Property(nameof(PipelineRequest.Uri)));
        public MethodBodyStatement SetMethod(string method) => Assign(Untyped.Property("Method"), Literal(method));
        public MethodBodyStatement SetHeaderValue(string name, StringExpression value)
            => new InvokeInstanceMethodStatement(Untyped.Property(nameof(PipelineRequest.Headers)), nameof(PipelineRequestHeaders.Set), Literal(name), value);
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record PipelineRequestSnippet(ValueExpression Expression) : TypedSnippet<PipelineRequest>(Expression)
    {
        public ScopedApi<Uri> Uri => Property(nameof(PipelineRequest.Uri)).As<Uri>();
        public MethodBodyStatement SetMethod(string method) => Expression.Property("Method").Assign(Literal(method)).Terminate();
        public MethodBodyStatement SetHeaderValue(string name, ScopedApi<string> value)
            => Expression.Property(nameof(PipelineRequest.Headers)).Invoke(nameof(PipelineRequestHeaders.Set), Literal(name), value).Terminate();
    }
}

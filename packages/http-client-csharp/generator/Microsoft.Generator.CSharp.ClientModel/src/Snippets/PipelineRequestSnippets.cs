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
    internal static class PipelineRequestSnippets
    {
        public static ScopedApi<Uri> Uri(this ScopedApi<PipelineRequest> pipelineRequest)
            => pipelineRequest.Property(nameof(PipelineRequest.Uri)).As<Uri>();

        public static MethodBodyStatement SetMethod(this ScopedApi<PipelineRequest> pipelineRequest, string method)
            => pipelineRequest.Property("Method").Assign(Literal(method)).Terminate();

        public static MethodBodyStatement SetHeaderValue(this ScopedApi<PipelineRequest> pipelineRequest, string name, ValueExpression value)
            => pipelineRequest.Property(nameof(PipelineRequest.Headers)).Invoke(nameof(PipelineRequestHeaders.Set), Literal(name), value).Terminate();

        public static MethodBodyStatement AddHeaderValue(this ScopedApi<PipelineRequest> pipelineRequest, string name, ValueExpression value)
            => pipelineRequest.Property(nameof(PipelineRequest.Headers)).Invoke(nameof(PipelineRequestHeaders.Add), [Literal(name), value]).Terminate();

        public static MethodBodyStatement SetContent(this ScopedApi<PipelineRequest> pipelineRequest, ValueExpression content)
            => pipelineRequest.Property(nameof(PipelineRequest.Content)).Assign(content).Terminate();
    }
}

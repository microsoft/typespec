// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class HttpRequestApiSnippets
    {
        public static MethodBodyStatement SetHeaderValue(this ScopedApi<PipelineRequest> pipelineRequest, string name, ValueExpression value)
            => pipelineRequest.Property(nameof(PipelineRequest.Headers)).Invoke(nameof(PipelineRequestHeaders.Set), Literal(name), value).Terminate();

        public static MethodBodyStatement AddHeaderValue(this ScopedApi<PipelineRequest> pipelineRequest, string name, ValueExpression value)
            => pipelineRequest.Property(nameof(PipelineRequest.Headers)).Invoke(nameof(PipelineRequestHeaders.Add), [Literal(name), value]).Terminate();

        public static MethodBodyStatement SetContent(this ScopedApi<PipelineRequest> pipelineRequest, ValueExpression content)
            => pipelineRequest.Property(nameof(PipelineRequest.Content)).Assign(content).Terminate();

        public static MethodBodyStatement SetHeaderDelimited(this HttpRequestApi pipelineRequest, string name, ValueExpression value, ValueExpression delimiter, ValueExpression? format = null)
        {
            ValueExpression[] parameters = format != null ? [Literal(name), value, delimiter, format] : [Literal(name), value, delimiter];
            return pipelineRequest.Property(nameof(PipelineRequest.Headers)).Invoke("SetDelimited", parameters).Terminate();
        }
    }
}

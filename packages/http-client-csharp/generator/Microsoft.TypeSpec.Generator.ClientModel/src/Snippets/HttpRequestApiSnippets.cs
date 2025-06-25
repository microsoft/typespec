// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
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

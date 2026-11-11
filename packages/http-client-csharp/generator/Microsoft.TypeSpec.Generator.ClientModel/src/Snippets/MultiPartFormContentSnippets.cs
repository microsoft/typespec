// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

#pragma warning disable SCME0004 // MultiPartFormContent is evaluation-only.
namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class MultiPartFormContentSnippets
    {
        private static readonly CSharpType _type = typeof(MultiPartFormContent);
        private const string AddMethodName = nameof(MultiPartFormContent.Add);
        private const string ToMultipartFormContentMethodName = "ToMultipartFormContent";
        private const string WithMediaTypeMethodName = nameof(BinaryData.WithMediaType);

        /// <summary> Gets the <see cref="CSharpType"/> for <see cref="MultiPartFormContent"/>. </summary>
        public static CSharpType Type => _type;

        public static ScopedApi<MultiPartFormContent> New() => Snippet.New.Instance(_type).As<MultiPartFormContent>();

        public static MethodBodyStatement Add(this ScopedApi<MultiPartFormContent> content, string name, ValueExpression value, string? contentType = null)
            => contentType is null
                ? content.Invoke(AddMethodName, [Literal(name), value]).Terminate()
                : content.Invoke(AddMethodName, [Literal(name), value, Literal(contentType)]).Terminate();

        public static MethodBodyStatement Add(this ScopedApi<MultiPartFormContent> content, string name, ValueExpression value, ValueExpression context, ScopedApi<ModelReaderWriterOptions> options, string? contentType = null, CSharpType? modelType = null)
        {
            var args = contentType is null
                ? [Literal(name), value, context, options]
                : new ValueExpression[] { Literal(name), value, context, options, Literal(contentType) };
            var typeArgs = modelType is null ? null : new[] { modelType };
            return content.Invoke(AddMethodName, args, typeArgs, callAsAsync: false).Terminate();
        }

        public static MethodBodyStatement AddWithMediaType(this ScopedApi<MultiPartFormContent> content, string name, ValueExpression value, string mediaType)
            => content.Invoke(AddMethodName, [Literal(name), value.Invoke(WithMediaTypeMethodName, [Literal(mediaType)])]).Terminate();

        public static ValueExpression ToMultipartFormContent(ValueExpression model, ScopedApi<ModelReaderWriterOptions> options)
            => model.Invoke(ToMultipartFormContentMethodName, options);
    }
}
#pragma warning restore SCME0004

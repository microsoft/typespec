// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class MultipartFormDataHelperSnippets
    {
        public static ValueExpression FromEnumerable(ValueExpression body, ScopedApi<ModelReaderWriterOptions> options, string? mediaType = null)
            => Static<MultipartFormDataHelperDefinition>().Invoke("FromEnumerable", BuildArguments(body, options, mediaType));

        public static ValueExpression FromDictionary(ValueExpression body, ScopedApi<ModelReaderWriterOptions> options, string? mediaType = null)
            => Static<MultipartFormDataHelperDefinition>().Invoke("FromDictionary", BuildArguments(body, options, mediaType));

        private static ValueExpression[] BuildArguments(ValueExpression body, ScopedApi<ModelReaderWriterOptions> options, string? mediaType)
            => mediaType is null
                ? [body, options]
                : [body, options, Literal(mediaType)];
    }
}

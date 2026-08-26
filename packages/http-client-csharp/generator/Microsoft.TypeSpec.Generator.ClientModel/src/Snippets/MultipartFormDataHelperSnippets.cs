// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class MultipartFormDataHelperSnippets
    {
        public static ValueExpression FromEnumerable(ValueExpression body, string? mediaType = null)
            => Static<MultipartFormDataHelperDefinition>().Invoke("FromEnumerable", BuildArguments(body, mediaType));

        public static ValueExpression FromDictionary(ValueExpression body, string? mediaType = null)
            => Static<MultipartFormDataHelperDefinition>().Invoke("FromDictionary", BuildArguments(body, mediaType));

        private static ValueExpression[] BuildArguments(ValueExpression body, string? mediaType)
            => mediaType is null
                ? [body]
                : [body, Literal(mediaType)];
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class RequestContentApiSnippets
    {
        public static RequestContentApi Create(ValueExpression serializable)
            => Static(ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType).Invoke(nameof(BinaryContent.Create), serializable).ToApi<RequestContentApi>();

        public static RequestContentApi Create(ValueExpression serializable, ScopedApi<ModelReaderWriterOptions> options, CSharpType? typeArgument = null)
            => Static(ScmCodeModelGenerator.Instance.TypeFactory.RequestContentApi.RequestContentType).Invoke(nameof(BinaryContent.Create), [serializable, options], typeArgument != null ? [typeArgument] : null, false).ToApi<RequestContentApi>();
    }
}

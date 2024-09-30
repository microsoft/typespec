// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class BinaryContentSnippets
    {
        public static ScopedApi<BinaryContent> Create(ValueExpression serializable)
            => Static(ClientModelPlugin.Instance.TypeFactory.RequestContentType).Invoke(nameof(BinaryContent.Create), serializable).As<BinaryContent>();

        public static ScopedApi<BinaryContent> Create(ValueExpression serializable, ScopedApi<ModelReaderWriterOptions> options, CSharpType? typeArgument = null)
            => Static<BinaryContent>().Invoke(nameof(BinaryContent.Create), [serializable, options], typeArgument != null ? [typeArgument] : null, false).As<BinaryContent>();
    }
}

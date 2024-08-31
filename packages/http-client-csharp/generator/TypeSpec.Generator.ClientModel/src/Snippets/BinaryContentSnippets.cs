// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Primitives;
using TypeSpec.Generator.Snippets;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class BinaryContentSnippets
    {
        public static ScopedApi<BinaryContent> Create(ValueExpression serializable)
            => Static<BinaryContent>().Invoke(nameof(BinaryContent.Create), serializable).As<BinaryContent>();

        public static ScopedApi<BinaryContent> Create(ValueExpression serializable, ScopedApi<ModelReaderWriterOptions> options, CSharpType? typeArgument = null)
            => Static<BinaryContent>().Invoke(nameof(BinaryContent.Create), [serializable, options], typeArgument != null ? [typeArgument] : null, false).As<BinaryContent>();
    }
}

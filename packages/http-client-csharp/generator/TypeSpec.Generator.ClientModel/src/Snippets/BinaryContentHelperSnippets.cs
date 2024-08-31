// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using TypeSpec.Generator.ClientModel.Providers;
using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Snippets;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class BinaryContentHelperSnippets
    {
        public static ScopedApi<BinaryContent> FromEnumerable(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromEnumerable", body).As<BinaryContent>();

        public static ScopedApi<BinaryContent> FromDictionary(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromDictionary", body).As<BinaryContent>();

        public static ScopedApi<BinaryContent> FromReadOnlyMemory(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromReadOnlyMemory", body).As<BinaryContent>();

        public static ScopedApi<BinaryContent> FromObject(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromObject", body).As<BinaryContent>();
    }
}

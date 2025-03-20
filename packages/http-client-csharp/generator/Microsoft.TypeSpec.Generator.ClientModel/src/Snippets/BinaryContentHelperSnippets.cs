// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
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

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class BinaryContentHelperSnippets
    {
        public static ScopedApi<BinaryContent> FromEnumerable(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromEnumerable", body).As<BinaryContent>();

        public static ScopedApi<BinaryContent> FromReadOnlyMemory(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromReadOnlyMemory", body).As<BinaryContent>();

        public static ScopedApi<BinaryContent> FromObject(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromObject", body).As<BinaryContent>();
    }
}

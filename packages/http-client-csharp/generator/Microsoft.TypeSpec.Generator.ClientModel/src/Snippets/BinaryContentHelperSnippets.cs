// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class BinaryContentHelperSnippets
    {
        public static ValueExpression FromEnumerable(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromEnumerable", body);

        public static ValueExpression FromDictionary(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromDictionary", body);

        public static ValueExpression FromObject(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromObject", body);
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class BinaryContentHelperSnippets
    {
        public static ValueExpression FromEnumerable(ValueExpression body, ValueExpression? options = null)
            => Static<BinaryContentHelperDefinition>().Invoke("FromEnumerable", options is null ? [body] : [body, options]);

        public static ValueExpression FromEnumerable(ValueExpression body, ValueExpression rootNameHint, ValueExpression childNameHint, ValueExpression? options = null)
            => Static<BinaryContentHelperDefinition>().Invoke("FromEnumerable",
                options is null ? [body, rootNameHint, childNameHint] : [body, rootNameHint, childNameHint, options]);

        public static ValueExpression FromDictionary(ValueExpression body, ValueExpression? options = null)
            => Static<BinaryContentHelperDefinition>().Invoke("FromDictionary", options is null ? [body] : [body, options]);

        public static ValueExpression FromObject(ValueExpression body)
            => Static<BinaryContentHelperDefinition>().Invoke("FromObject", body);
    }
}

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
    internal static class BinaryContentHelperSnippets
    {
        public static ValueExpression FromEnumerable(ValueExpression body, ScopedApi<ModelReaderWriterOptions> options)
            => Static<BinaryContentHelperDefinition>().Invoke("FromEnumerable", [body, options]);

        public static ValueExpression FromEnumerable(ValueExpression body, ValueExpression rootNameHint, ValueExpression childNameHint, ScopedApi<ModelReaderWriterOptions> options)
            => Static<BinaryContentHelperDefinition>().Invoke("FromEnumerable", [body, rootNameHint, childNameHint, options]);

        public static ValueExpression FromDictionary(ValueExpression body, ScopedApi<ModelReaderWriterOptions> options)
            => Static<BinaryContentHelperDefinition>().Invoke("FromDictionary", [body, options]);

        public static ValueExpression FromObject(ValueExpression body, ScopedApi<ModelReaderWriterOptions> options)
            => Static<BinaryContentHelperDefinition>().Invoke("FromObject", [body, options]);
    }
}

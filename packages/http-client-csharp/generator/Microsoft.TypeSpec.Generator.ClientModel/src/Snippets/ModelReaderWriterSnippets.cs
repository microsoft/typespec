// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class ModelReaderWriterSnippets
    {
        public static ValueExpression Read(
            CSharpType type,
            ValueExpression data,
            ValueExpression options)
            => Static(typeof(ModelReaderWriter)).Invoke(
                nameof(ModelReaderWriter.Read),
                [data, options, ModelReaderWriterContextSnippets.Default],
                [type]);

        public static ValueExpression Write(
            ValueExpression value,
            ValueExpression options)
            => Static(typeof(ModelReaderWriter)).Invoke(
                nameof(ModelReaderWriter.Write),
                [value, options, ModelReaderWriterContextSnippets.Default]);
    }
}

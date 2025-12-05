// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class ModelReaderWriterSnippets
    {
        public static InvokeMethodExpression Read(ValueExpression data, CSharpType type)
        {
            return Static(typeof(ModelReaderWriter)).Invoke(
                nameof(ModelReaderWriter.Read),
                [data, ModelSerializationExtensionsSnippets.Wire, ModelReaderWriterContextSnippets.Default],
                new CSharpType[] { type });
        }
    }
}

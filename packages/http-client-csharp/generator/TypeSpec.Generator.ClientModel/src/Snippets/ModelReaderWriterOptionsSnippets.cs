// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using TypeSpec.Generator.Expressions;
using TypeSpec.Generator.Snippets;
using static TypeSpec.Generator.ClientModel.Snippets.ModelSerializationExtensionsSnippets;
using static TypeSpec.Generator.Snippets.Snippet;

namespace TypeSpec.Generator.ClientModel.Snippets
{
    internal static class ModelReaderWriterOptionsSnippets
    {
        public static ValueExpression Format(this ScopedApi<ModelReaderWriterOptions> mrwOptions) => mrwOptions.Property(nameof(ModelReaderWriterOptions.Format));
        internal static ScopedApi<string> WireFormat => Literal("W");
        internal static ScopedApi<string> JsonFormat => Literal("J");
        internal static ScopedApi<ModelReaderWriterOptions> InitializeWireOptions => New.Instance(typeof(ModelReaderWriterOptions), Wire).As<ModelReaderWriterOptions>();
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.ClientModel.Snippets.ModelSerializationExtensionsSnippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ModelReaderWriterOptionsSnippets
    {
        public static ValueExpression Format(this ScopedApi<ModelReaderWriterOptions> mrwOptions) => mrwOptions.Property(nameof(ModelReaderWriterOptions.Format));
        internal static ScopedApi<string> WireFormat => Literal("W");
        internal static ScopedApi<string> JsonFormat => Literal("J");
        internal static ScopedApi<ModelReaderWriterOptions> InitializeWireOptions => New.Instance(typeof(ModelReaderWriterOptions), Wire).As<ModelReaderWriterOptions>();
    }
}

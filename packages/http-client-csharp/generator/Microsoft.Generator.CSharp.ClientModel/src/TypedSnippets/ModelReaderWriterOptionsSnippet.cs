// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using static Microsoft.Generator.CSharp.ClientModel.Snippets.ModelSerializationExtensionsSnippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ModelReaderWriterOptionsSnippet(ValueExpression Untyped) : TypedSnippet<ModelReaderWriterOptions>(Untyped)
    {
        public ValueExpression Format => new MemberExpression(this, nameof(ModelReaderWriterOptions.Format));
        internal static StringSnippet WireFormat => Literal("W");
        internal static StringSnippet JsonFormat => Literal("J");
        internal static ModelReaderWriterOptionsSnippet InitializeWireOptions => new(New.Instance(typeof(ModelReaderWriterOptions), Wire));
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record BinaryContentSnippet(ValueExpression Expression) : TypedSnippet<BinaryContent>(Expression)
    {
        public static BinaryContentSnippet Create(ValueExpression serializable)
            => new(InvokeStatic(nameof(BinaryContent.Create), serializable));

        public static BinaryContentSnippet Create(ValueExpression serializable, ModelReaderWriterOptionsSnippet options, CSharpType? typeArgument = null)
            => new(new InvokeStaticMethodExpression(typeof(BinaryContent), nameof(BinaryContent.Create), [serializable, options], TypeArguments: typeArgument != null ? new[] { typeArgument } : null));
    }
}

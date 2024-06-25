// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ModelReaderWriterOptionsSnippet(ValueExpression Untyped) : TypedSnippet<ModelReaderWriterOptions>(Untyped)
    {
        public ValueExpression Format => new MemberExpression(this, nameof(ModelReaderWriterOptions.Format));
    }
}

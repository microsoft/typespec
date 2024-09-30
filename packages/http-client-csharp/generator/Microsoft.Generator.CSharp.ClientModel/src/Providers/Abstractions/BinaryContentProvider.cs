// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record BinaryContentProvider : RequestContentApi
    {
        public BinaryContentProvider(ValueExpression original) : base(typeof(BinaryContent), original)
        {
        }

        public override MethodBodyStatement[] ToRquestContent()
            => [Return(Static(typeof(BinaryContent)).Invoke(nameof(BinaryContent.Create), [This, ModelSerializationExtensionsSnippets.Wire]))];
    }
}

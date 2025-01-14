// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal record BinaryContentProvider : RequestContentApi
    {
        private static RequestContentApi? _instance;
        internal static RequestContentApi Instance => _instance ??= new BinaryContentProvider(Empty);

        public BinaryContentProvider(ValueExpression original) : base(typeof(BinaryContent), original)
        {
        }

        public override CSharpType RequestContentType => typeof(BinaryContent);

        public override RequestContentApi FromExpression(ValueExpression original)
            => new BinaryContentProvider(original);

        public override RequestContentApi ToExpression() => this;

        public override MethodBodyStatement[] Create(ValueExpression argument)
            => [Return(Static(typeof(BinaryContent)).Invoke(nameof(BinaryContent.Create), [argument, ModelSerializationExtensionsSnippets.Wire]))];
    }
}

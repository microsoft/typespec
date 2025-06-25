// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
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

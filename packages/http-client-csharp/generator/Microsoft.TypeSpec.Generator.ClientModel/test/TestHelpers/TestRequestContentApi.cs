// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests
{
    public record TestRequestContentApi : RequestContentApi
    {
        private static TestRequestContentApi? _instance;
        internal static TestRequestContentApi Instance => _instance ??= new();
        public TestRequestContentApi(ValueExpression original) : base(typeof(string), original)
        {
        }
        private TestRequestContentApi() : base(typeof(string), Empty)
        {
        }

        public override CSharpType RequestContentType => new CSharpType(typeof(string));
        public override RequestContentApi FromExpression(ValueExpression original) =>
            new TestRequestContentApi(original);

        public override RequestContentApi ToExpression() => this;
        public override MethodBodyStatement[] Create(ValueExpression argument)
            => [Original.Invoke("FakeCreate", argument).Terminate()];
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ClientPipelineExtensionsProvider : TypeProvider
    {
        public override string RelativeFilePath => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");
        public override string Name { get; }

        private const string _processMessageAsync = "ProcessMessageAsync";
        private const string _processMessage = "ProcessMessage";
        private const string _processHeadAsBoolMessageAsync = "ProcessHeadAsBoolMessageAsync";
        private const string _processHeadAsBoolMessage = "ProcessHeadAsBoolMessage";

        private ParameterProvider _pipelineParam;
        private ParameterProvider _messageParam;
        private ParameterProvider _requestContextParam;
        private MemberExpression _messageResponse;

        internal ClientPipelineExtensionsProvider()
        {
            Name = "ClientPipelineExtensions";
            _pipelineParam = new ParameterProvider("pipeline", $"The pipeline.", typeof(ClientPipeline));
            _messageParam = new ParameterProvider("message", $"The message.", typeof(PipelineMessage));
            _requestContextParam = new ParameterProvider("requestContext", $"The request context.", typeof(RequestOptions));
            _messageResponse = new MemberExpression(_messageParam, "Response");
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        internal PipelineResponseSnippet ProcessMessage(IReadOnlyList<ValueExpression> arguments, bool isAsync)
        {
            return new(new InvokeStaticMethodExpression(Type, isAsync ? _processMessageAsync : _processMessage, arguments, CallAsExtension: true, CallAsAsync: isAsync));
        }

        internal ClientResultSnippet ProcessHeadAsBoolMessage(IReadOnlyList<ValueExpression> arguments, bool isAsync)
        {
            return new(new InvokeStaticMethodExpression(Type, isAsync ? _processHeadAsBoolMessageAsync : _processHeadAsBoolMessage, arguments, CallAsExtension: true, CallAsAsync: isAsync));
        }
    }
}

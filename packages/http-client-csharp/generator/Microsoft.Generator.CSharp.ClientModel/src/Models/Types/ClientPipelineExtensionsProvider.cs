// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal class ClientPipelineExtensionsProvider : TypeProvider
    {
        private static readonly Lazy<ClientPipelineExtensionsProvider> _instance = new(() => new ClientPipelineExtensionsProvider());
        public static ClientPipelineExtensionsProvider Instance => _instance.Value;
        public override string Name { get; }

        private const string _processMessageAsync = "ProcessMessageAsync";
        private const string _processMessage = "ProcessMessage";
        private const string _processHeadAsBoolMessageAsync = "ProcessHeadAsBoolMessageAsync";
        private const string _processHeadAsBoolMessage = "ProcessHeadAsBoolMessage";

        private Parameter _pipelineParam;
        private Parameter _messageParam;
        private Parameter _requestContextParam;
        private ParameterReferenceSnippet _pipeline;
        private ParameterReferenceSnippet _message;
        private ParameterReferenceSnippet _requestContext;
        private MemberExpression _messageResponse;

        private ClientPipelineExtensionsProvider()
        {
            Name = "ClientPipelineExtensions";
            _pipelineParam = new Parameter("pipeline", null, typeof(ClientPipeline), null, ParameterValidationType.None, null);
            _messageParam = new Parameter("message", null, typeof(PipelineMessage), null, ParameterValidationType.None, null);
            _requestContextParam = new Parameter("requestContext", null, typeof(RequestOptions), null, ParameterValidationType.None, null);
            _pipeline = new ParameterReferenceSnippet(_pipelineParam);
            _message = new ParameterReferenceSnippet(_messageParam);
            _requestContext = new ParameterReferenceSnippet(_requestContextParam);
            _messageResponse = new MemberExpression(_message, "Response");
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

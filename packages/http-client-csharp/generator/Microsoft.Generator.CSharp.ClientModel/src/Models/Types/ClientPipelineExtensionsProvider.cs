// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using System.ClientModel.Primitives;
using System.ClientModel;
using Microsoft.Generator.CSharp.ClientModel.Expressions;
using System.Collections.Generic;

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
        private ParameterReference _pipeline;
        private ParameterReference _message;
        private ParameterReference _requestContext;
        private MemberExpression _messageResponse;

        private ClientPipelineExtensionsProvider()
            : base(null)
        {
            Name = "ClientPipelineExtensions";
            _pipelineParam = new Parameter("pipeline", $"The pipeline.", typeof(ClientPipeline));
            _messageParam = new Parameter("message", $"The message.", typeof(PipelineMessage));
            _requestContextParam = new Parameter("requestContext", $"The request context.", typeof(RequestOptions));
            _pipeline = new ParameterReference(_pipelineParam);
            _message = new ParameterReference(_messageParam);
            _requestContext = new ParameterReference(_requestContextParam);
            _messageResponse = new MemberExpression(_message, "Response");
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        internal PipelineResponseExpression ProcessMessage(IReadOnlyList<ValueExpression> arguments, bool isAsync)
        {
            return new(new InvokeStaticMethodExpression(Type, isAsync ? _processMessageAsync : _processMessage, arguments, CallAsExtension: true, CallAsAsync: isAsync));
        }

        internal ClientResultExpression ProcessHeadAsBoolMessage(IReadOnlyList<ValueExpression> arguments, bool isAsync)
        {
            return new(new InvokeStaticMethodExpression(Type, isAsync ? _processHeadAsBoolMessageAsync : _processHeadAsBoolMessage, arguments, CallAsExtension: true, CallAsAsync: isAsync));
        }
    }
}

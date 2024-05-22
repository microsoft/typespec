// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.ClientModel.Primitives.Pipeline;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Expressions;
using Microsoft.Generator.CSharp.Expressions;

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
            DeclarationModifiers = TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
            _pipelineParam = new Parameter("pipeline", null, typeof(ClientPipeline), null, ValidationType.None, null);
            _messageParam = new Parameter("message", null, typeof(PipelineMessage), null, ValidationType.None, null);
            _requestContextParam = new Parameter("requestContext", null, typeof(RequestOptions), null, ValidationType.None, null);
            _pipeline = new ParameterReference(_pipelineParam);
            _message = new ParameterReference(_messageParam);
            _requestContext = new ParameterReference(_requestContextParam);
            _messageResponse = new MemberExpression(_message, "Response");
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

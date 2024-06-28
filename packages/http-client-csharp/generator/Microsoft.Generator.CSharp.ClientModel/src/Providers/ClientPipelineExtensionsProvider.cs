// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ClientPipelineExtensionsProvider : TypeProvider
    {
        private static readonly Lazy<ClientPipelineExtensionsProvider> _instance = new(() => new ClientPipelineExtensionsProvider());

        public static ClientPipelineExtensionsProvider Instance => _instance.Value;

        private const string _processMessageAsync = "ProcessMessageAsync";
        private const string _processMessage = "ProcessMessage";
        private const string _processHeadAsBoolMessageAsync = "ProcessHeadAsBoolMessageAsync";
        private const string _processHeadAsBoolMessage = "ProcessHeadAsBoolMessage";

        private ParameterProvider _pipelineParam;
        private ParameterProvider _messageParam;
        private ParameterProvider _requestOptionsParam;
        private ClientPipelineSnippet _pipeline;
        private PipelineMessageSnippet _message;
        private RequestOptionsSnippet _options;

        public ClientPipelineExtensionsProvider()
        {
            _pipelineParam = new ParameterProvider("pipeline", FormattableStringHelpers.Empty, typeof(ClientPipeline));
            _messageParam = new ParameterProvider("message", FormattableStringHelpers.Empty, typeof(PipelineMessage));
            _requestOptionsParam = new ParameterProvider("options", FormattableStringHelpers.Empty, typeof(RequestOptions));
            _pipeline = new ClientPipelineSnippet(_pipelineParam);
            _message = new PipelineMessageSnippet(_messageParam);
            _options = new RequestOptionsSnippet(_requestOptionsParam);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Static;
        }

        public override string Name => "ClientPipelineExtensions";

        public override string RelativeFilePath => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override MethodProvider[] BuildMethods()
        {
            return
            [
                BuildProcessMessageAsync(),
                BuildProcessMessage(),
                ProcessHeadAsBoolMessageAsync(),
                ProcessHeadAsBoolMessage()
            ];
        }

        private MethodProvider ProcessHeadAsBoolMessage()
        {
            MethodSignature signature = GetProcessHeadAsBoolMessageSignature(false);
            var responseVariable = new VariableExpression(typeof(PipelineResponse), "response");
            var response = new PipelineResponseSnippet(responseVariable);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new DeclarationExpression(responseVariable, false).Assign(_pipeline.ProcessMessage(_message, _options, false)).Terminate(),
                GetProcessHeadAsBoolMessageBody(response)
            }, this);
        }

        private MethodProvider ProcessHeadAsBoolMessageAsync()
        {
            MethodSignature signature = GetProcessHeadAsBoolMessageSignature(true);
            var responseVariable = new VariableExpression(typeof(PipelineResponse), "response");
            var response = new PipelineResponseSnippet(responseVariable);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new DeclarationExpression(responseVariable, false).Assign(_pipeline.ProcessMessage(_message, _options, true)).Terminate(),
                GetProcessHeadAsBoolMessageBody(response)
            }, this);
        }

        private MethodBodyStatement GetProcessHeadAsBoolMessageBody(PipelineResponseSnippet response)
        {
            return new MethodBodyStatement[]
            {
                new SwitchStatement(new MemberExpression(response, "Status"), new SwitchCaseStatement[]
                {
                    new SwitchCaseStatement(new BinaryOperatorExpression("<", new UnaryOperatorExpression("and", new UnaryOperatorExpression(">=", Literal(200), false), true), Literal(300)), new MethodBodyStatement[]
                    {
                        Return(ClientResultSnippet.FromValue(typeof(bool), True, response))
                    }),
                    new SwitchCaseStatement(new BinaryOperatorExpression("<", new UnaryOperatorExpression("and", new UnaryOperatorExpression(">=", Literal(400), false), true), Literal(500)), new MethodBodyStatement[]
                    {
                        Return(ClientResultSnippet.FromValue(typeof(bool), False, response))
                    }),
                    new SwitchCaseStatement(Array.Empty<ValueExpression>(), new MethodBodyStatement[]
                    {
                        Return(new NewInstanceExpression(ErrorResultSnippet.ErrorResultType.MakeGenericType([typeof(bool)]), [response, new NewInstanceExpression(typeof(ClientResultException), [response])]))
                    })
                }),
            };
        }

        private MethodSignature GetProcessHeadAsBoolMessageSignature(bool isAsync)
        {
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension;
            if (isAsync)
            {
                modifiers |= MethodSignatureModifiers.Async;
            }
            return new MethodSignature(
                isAsync ? "ProcessHeadAsBoolMessageAsync" : "ProcessHeadAsBoolMessage",
                null,
                modifiers,
                isAsync ? typeof(ValueTask<ClientResult<bool>>) : typeof(ClientResult<bool>),
                null,
                [_pipelineParam, _messageParam, _requestOptionsParam]);
        }

        private MethodProvider BuildProcessMessage()
        {
            MethodSignature signature = GetProcessMessageSignature(false);

            var clientErrorNoThrow = FrameworkEnumValue(ClientErrorBehaviors.NoThrow);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                _pipeline.Invoke(nameof(ClientPipeline.Send), [_message]).Terminate(),
                EmptyLineStatement,
                new IfStatement(_message.Response.IsError.And(new BinaryOperatorExpression("&", _options.Property("ErrorOptions", true), clientErrorNoThrow).NotEqual(clientErrorNoThrow)))
                {
                    Throw(New.Instance(typeof(ClientResultException), _message.Response))
                },
                EmptyLineStatement,
                Declare("response", typeof(PipelineResponse), new TernaryConditionalExpression(_message.BufferResponse, _message.Response, _message.ExtractResponse()), out var response),
                Return(response)
            }, this);
        }

        private MethodSignature GetProcessMessageSignature(bool isAsync)
        {
            var modifiers = MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension;
            if (isAsync)
            {
                modifiers |= MethodSignatureModifiers.Async;
            }
            return new MethodSignature(
                isAsync ? "ProcessMessageAsync" : "ProcessMessage",
                null,
                modifiers,
                isAsync ? typeof(ValueTask<PipelineResponse>) : typeof(PipelineResponse),
                null,
                [_pipelineParam, _messageParam, _requestOptionsParam]);
        }

        private MethodProvider BuildProcessMessageAsync()
        {
            MethodSignature signature = GetProcessMessageSignature(true);

            var clientErrorNoThrow = FrameworkEnumValue(ClientErrorBehaviors.NoThrow);
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                _pipeline.Expression.Invoke(nameof(ClientPipeline.SendAsync), [_message], true).Terminate(),
                EmptyLineStatement,
                new IfStatement(_message.Response.IsError.And(new BinaryOperatorExpression("&", _options.Property("ErrorOptions", true), clientErrorNoThrow).NotEqual(clientErrorNoThrow)))
                {
                    Throw(new InvokeStaticMethodExpression(typeof(ClientResultException), nameof(ClientResultException.CreateAsync), [_message.Response], CallAsAsync: true))
                },
                EmptyLineStatement,
                Declare("response", typeof(PipelineResponse), new TernaryConditionalExpression(_message.BufferResponse, _message.Response, _message.ExtractResponse()), out var response),
                Return(response)
            }, this);
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class ScmMethodProviderCollection : MethodProviderCollection
    {
        private string _cleanOperationName;
        private ParameterProvider? _bodyParameter;

        private readonly string _createRequestMethodName;

        public ScmMethodProviderCollection(InputOperation operation, TypeProvider enclosingType)
            : base(operation, enclosingType)
        {
            _cleanOperationName = operation.Name.ToCleanName();
            _createRequestMethodName = "Create" + _cleanOperationName + "Request";
        }

        protected override IReadOnlyList<MethodProvider> BuildMethods()
        {
            return
            [
                BuildProtocolMethod(false),
                BuildProtocolMethod(true),
                BuildConvenienceMethod(false),
                BuildConvenienceMethod(true),
            ];
        }

        internal MethodProvider BuildCreateMessageMethod()
        {
            var methodModifier = MethodSignatureModifiers.Internal;
            var methodSignature = new MethodSignature(
                _createRequestMethodName,
                FormattableStringHelpers.FromString(Operation.Description),
                methodModifier,
                typeof(PipelineMessage),
                null,
                Parameters: [.. MethodParameters, ScmKnownParameters.RequestOptions]);
            var methodBody = Throw(New.NotImplementedException(Literal("Method not implemented.")));

            return new MethodProvider(methodSignature, methodBody, EnclosingType);
        }

        private MethodProvider BuildConvenienceMethod(bool isAsync)
        {
            ClientProvider? client = EnclosingType as ClientProvider;
            if (client is null)
            {
                throw new InvalidOperationException("Protocol methods can only be built for client types.");
            }

            var methodModifier = MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual;
            if (isAsync)
            {
                methodModifier |= MethodSignatureModifiers.Async;
            }
            var methodSignature = new MethodSignature(
                isAsync ? _cleanOperationName + "Async" : _cleanOperationName,
                FormattableStringHelpers.FromString(Operation.Description),
                methodModifier,
                GetResponseType(Operation.Responses, true, isAsync),
                null,
                Parameters: ConvenienceMethodParameters);
            var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMessage";
            MethodBodyStatement[] methodBody = _bodyParameter is null
                ? [Return(This.Invoke(methodSignature, [.. ConvenienceMethodParameters, Null], isAsync))]
                : [
                    Declare("result", typeof(ClientResult), This.Invoke(methodSignature, [.. ConvenienceMethodParameters, Null], isAsync), out var result),
                    Return(Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), [result.CastTo(_bodyParameter.Type), result.Invoke("GetRawResponse")])),
                ];

            var convenienceMethod = new ScmMethodProvider(methodSignature, methodBody, EnclosingType);
            convenienceMethod.XmlDocs!.Exceptions.Add(new(typeof(ClientResultException), "Service returned a non-success status code.", []));
            return convenienceMethod;
        }

        private List<ParameterProvider>? _methodParameters;
        public List<ParameterProvider> MethodParameters => _methodParameters ??= GetMethodParameters(false);

        private List<ParameterProvider>? _convenienceMethodParameters;
        private List<ParameterProvider> ConvenienceMethodParameters => _convenienceMethodParameters ??= GetMethodParameters(true);

        private List<ParameterProvider> GetMethodParameters(bool isConvenience)
        {
            List<ParameterProvider> methodParameters = new();
            foreach (InputParameter inputParam in Operation.Parameters)
            {
                if (inputParam.Kind != InputOperationParameterKind.Method)
                    continue;
                if (inputParam.Location == RequestLocation.Body)
                {
                    var parameter = isConvenience ? ClientModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam) : ScmKnownParameters.BinaryContent;
                    _bodyParameter = parameter;
                    methodParameters.Add(parameter);
                }
                else
                {
                    methodParameters.Add(ClientModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam));
                }
            }
            return methodParameters;
        }

        private MethodProvider BuildProtocolMethod(bool isAsync)
        {
            ClientProvider? client = EnclosingType as ClientProvider;
            if (client is null)
            {
                throw new InvalidOperationException("Protocol methods can only be built for client types.");
            }

            var methodModifier = MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual;
            if (isAsync)
            {
                methodModifier |= MethodSignatureModifiers.Async;
            }
            var methodSignature = new MethodSignature(
                isAsync ? _cleanOperationName + "Async" : _cleanOperationName,
                FormattableStringHelpers.FromString(Operation.Description),
                methodModifier,
                GetResponseType(Operation.Responses, false, isAsync),
                $"The response returned from the service.",
                Parameters: [.. MethodParameters, ScmKnownParameters.RequestOptions]);
            var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMessage";

            MethodBodyStatement[] methodBody =
            [
                UsingDeclare("message", typeof(PipelineMessage), This.Invoke((MethodSignature)BuildCreateMessageMethod().Signature, [.. MethodParameters, ScmKnownParameters.RequestOptions]), out var message),
                Return(Static<ClientResult>().Invoke(nameof(ClientResult.FromResponse), client.PipelineField.Invoke(processMessageName, [message, ScmKnownParameters.RequestOptions], isAsync, true))),
            ];

            var protocolMethod =
                new ScmMethodProvider(methodSignature, methodBody, EnclosingType) { IsProtocol = true };
            protocolMethod.XmlDocs!.Exceptions.Add(new(typeof(ClientResultException), "Service returned a non-success status code.", []));
            List<XmlDocStatement> listItems =
            [
                new XmlDocStatement("item", [], new XmlDocStatement("description", [$"This <see href=\"https://aka.ms/azsdk/net/protocol-methods\">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios."]))
            ];
            XmlDocStatement listXmlDoc = new XmlDocStatement("<list type=\"bullet\">", "</list>", [], innerStatements: [.. listItems]);
            protocolMethod.XmlDocs.Summary = new XmlDocSummaryStatement([$"[Protocol Method] {Operation.Description}"], listXmlDoc);
            return protocolMethod;
        }

        private static CSharpType? GetResponseType(IReadOnlyList<OperationResponse> responses, bool isConvenience, bool isAsync)
        {
            var returnType = isConvenience ? GetConvenienceReturnType(responses) : typeof(ClientResult);
            return isAsync ? new CSharpType(typeof(Task<>), returnType) : returnType;
        }

        private static CSharpType GetConvenienceReturnType(IReadOnlyList<OperationResponse> responses)
        {
            var response = responses.FirstOrDefault(r => !r.IsErrorResponse);
            return response is null || response.BodyType is null
                ? typeof(ClientResult)
                : new CSharpType(typeof(ClientResult<>), ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(response.BodyType));
        }
    }
}

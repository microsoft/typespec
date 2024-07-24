// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class ScmMethodProviderCollection : MethodProviderCollection
    {
        private string _cleanOperationName;
        private ParameterProvider? _bodyParameter;
        private readonly MethodProvider _createRequestMethod;

        private readonly string _createRequestMethodName;

        private ClientProvider Client { get; }

        public ScmMethodProviderCollection(InputOperation operation, TypeProvider enclosingType)
            : base(operation, enclosingType)
        {
            _cleanOperationName = operation.Name.ToCleanName();
            _createRequestMethodName = "Create" + _cleanOperationName + "Request";
            Client = enclosingType as ClientProvider ?? throw new InvalidOperationException("Scm methods can only be built for client types.");
            _createRequestMethod = Client.RestClient.GetCreateRequestMethod(Operation);
        }

        protected override IReadOnlyList<MethodProvider> BuildMethods()
        {
            var syncProtocol = BuildProtocolMethod(_createRequestMethod, false);
            var asyncProtocol = BuildProtocolMethod(_createRequestMethod, true);

            return
            [
                syncProtocol,
                asyncProtocol,
                BuildConvenienceMethod(syncProtocol, false),
                BuildConvenienceMethod(asyncProtocol, true),
            ];
        }

        private MethodProvider BuildConvenienceMethod(MethodProvider protocolMethod, bool isAsync)
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
                ConvenienceMethodParameters);
            var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMessage";
            MethodBodyStatement[] methodBody = _bodyParameter is null
                ? [Return(This.Invoke(methodSignature, [.. ConvenienceMethodParameters, Null], isAsync))]
                : [
                    Declare("result", typeof(ClientResult), This.Invoke(protocolMethod.Signature, [.. ConvenienceMethodParameters, Null], isAsync), out var result),
                    Return(Static<ClientResult>().Invoke(nameof(ClientResult.FromValue), [result.CastTo(_bodyParameter.Type), result.Invoke("GetRawResponse")])),
                ];

            var convenienceMethod = new ScmMethodProvider(methodSignature, methodBody, EnclosingType);
            convenienceMethod.XmlDocs!.Exceptions.Add(new(typeof(ClientResultException), "Service returned a non-success status code.", []));
            return convenienceMethod;
        }

        public IReadOnlyList<ParameterProvider> MethodParameters => _createRequestMethod.Signature.Parameters;

        private IReadOnlyList<ParameterProvider>? _convenienceMethodParameters;
        private IReadOnlyList<ParameterProvider> ConvenienceMethodParameters => _convenienceMethodParameters ??= GetConvenienceMethodParameters();

        private IReadOnlyList<ParameterProvider> GetConvenienceMethodParameters()
        {
            // replace binary content with body parameter
            // skip last param since its requestOptions
            List<ParameterProvider> methodParameters = new(MethodParameters.Count - 1);
            var bodyInputParameter = Operation.Parameters.FirstOrDefault(p => p.Kind == InputOperationParameterKind.Method && p.Location == RequestLocation.Body);
            if (bodyInputParameter is null)
                return [.. MethodParameters.Take(MethodParameters.Count - 1)];

            _bodyParameter = ClientModelPlugin.Instance.TypeFactory.CreateParameter(bodyInputParameter);
            for (int i = 0; i < MethodParameters.Count - 1; i++)
            {
                if (ReferenceEquals(MethodParameters[i], ScmKnownParameters.BinaryContent))
                {
                    methodParameters.Add(_bodyParameter);
                }
                else
                {
                    methodParameters.Add(MethodParameters[i]);
                }
            }
            return methodParameters;
        }

        private MethodProvider BuildProtocolMethod(MethodProvider createRequestMethod, bool isAsync)
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
                MethodParameters);
            var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMessage";

            MethodBodyStatement[] methodBody =
            [
                UsingDeclare("message", typeof(PipelineMessage), This.Invoke(createRequestMethod.Signature, [.. MethodParameters]), out var message),
                Return(Static<ClientResult>().Invoke(nameof(ClientResult.FromResponse), client.PipelineProperty.Invoke(processMessageName, [message, ScmKnownParameters.RequestOptions], isAsync, true))),
            ];

            var protocolMethod =
                new ScmMethodProvider(methodSignature, methodBody, EnclosingType) { IsServiceCall = true };
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

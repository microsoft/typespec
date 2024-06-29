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
    internal class ScmMethodProviderCollection : MethodProviderCollection
    {
        private string _cleanOperationName;
        private string _createRequestMethodName;

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
                // TO-DO: Add Protocol and Convenience methods https://github.com/Azure/autorest.csharp/issues/4585, https://github.com/Azure/autorest.csharp/issues/4586
                BuildCreateMessageMethod(),
                BuildProtocolMethod(false),
                BuildProtocolMethod(true)
            ];
        }

        private List<ParameterProvider>? _methodParameters;
        private List<ParameterProvider> MethodParameters => _methodParameters ??= GetMethodParameters(_operation);

        private static List<ParameterProvider> GetMethodParameters(InputOperation operation)
        {
            List<ParameterProvider> methodParameters = new();
            foreach (InputParameter inputParam in operation.Parameters)
            {
                if (inputParam.Kind != InputOperationParameterKind.Method)
                    continue;
                if (inputParam.Location == RequestLocation.Body)
                {
                    // TODO: add concrete body with https://github.com/Azure/autorest.csharp/issues/4586
                    methodParameters.Add(ScmKnownParameters.BinaryContent);
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
            ClientProvider? client = _enclosingType as ClientProvider;
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
                FormattableStringHelpers.FromString(_operation.Description),
                methodModifier,
                GetResponseType(_operation.Responses, false, isAsync),
                $"The response returned from the service.",
                Parameters: [.. MethodParameters, ScmKnownParameters.RequestOptions]);
            var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMessage";
            MethodBodyStatement[] methodBody =
            [
                UsingDeclare("message", typeof(PipelineMessage), This.Invoke(_createRequestMethodName, [.. MethodParameters, ScmKnownParameters.RequestOptions]), out var message),
                Return(new InvokeStaticMethodExpression(
                    typeof(ClientResult),
                    nameof(ClientResult.FromResponse),
                    client.PipelineField.Invoke(processMessageName, [message, ScmKnownParameters.RequestOptions], isAsync, true))),
            ];

            var protocolMethod = new MethodProvider(methodSignature, methodBody, _enclosingType);
            protocolMethod.XmlDocs!.Exceptions.Add(new(typeof(ClientResultException), "Service returned a non-success status code.", []));
            List<XmlDocStatement> listItems = new List<XmlDocStatement>();
            listItems.Add(new XmlDocStatement("item", [], new XmlDocStatement("description", [$"This <see href=\"https://aka.ms/azsdk/net/protocol-methods\">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios."])));
            XmlDocStatement listXmlDoc = new XmlDocStatement("<list type=\"bullet\">", "</list>", [], innerStatements: [.. listItems]);
            protocolMethod.XmlDocs.Summary = new XmlDocSummaryStatement([$"[Protocol Method] {_operation.Description}"], listXmlDoc);
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

        private MethodProvider BuildCreateMessageMethod()
        {
            // TO-DO: properly build method https://github.com/Azure/autorest.csharp/issues/4583

            var methodModifier = MethodSignatureModifiers.Internal;
            var methodSignature = new MethodSignature(
                _createRequestMethodName,
                FormattableStringHelpers.FromString(_operation.Description),
                methodModifier,
                typeof(PipelineMessage),
                null,
                Parameters: [.. MethodParameters, ScmKnownParameters.RequestOptions]);
            var methodBody = Throw(New.NotImplementedException(Literal("Method not implemented.")));

            return new MethodProvider(methodSignature, methodBody, _enclosingType);
        }
    }
}

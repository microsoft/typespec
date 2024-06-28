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
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ScmMethodProviderCollection : MethodProviderCollection
    {
        public ScmMethodProviderCollection(InputOperation operation, TypeProvider enclosingType)
            : base(operation, enclosingType)
        {
        }

        protected override IReadOnlyList<MethodProvider> BuildMethods()
        {
            return
            [
                // TO-DO: Add Protocol and Convenience methods https://github.com/Azure/autorest.csharp/issues/4585, https://github.com/Azure/autorest.csharp/issues/4586
                BuildCreateMessageMethod(_operation, _enclosingType),
                BuildProtocolMethod(_operation, _enclosingType, false),
                BuildProtocolMethod(_operation, _enclosingType, true)
            ];
        }
        private static MethodProvider BuildProtocolMethod(InputOperation operation, TypeProvider enclosingType, bool isAsync)
        {
            ClientProvider? client = enclosingType as ClientProvider;
            if (client is null)
            {
                throw new InvalidOperationException("Protocol methods can only be built for client types.");
            }

            List<ParameterProvider> methodParameters = new();
            foreach (InputParameter inputParam in operation.Parameters)
            {
                if (inputParam.Kind != InputOperationParameterKind.Method)
                    continue;
                methodParameters.Add(ClientModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam));
            }

            var methodModifier = MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual;
            if (isAsync)
            {
                methodModifier |= MethodSignatureModifiers.Async;
            }
            var opName = operation.Name.ToCleanName();
            var methodSignature = new MethodSignature(
                isAsync ? opName + "Async" : opName,
                FormattableStringHelpers.FromString(operation.Description),
                methodModifier,
                GetResponseType(operation.Responses, isAsync),
                $"The response returned from the service.",
                Parameters: [.. methodParameters, ScmKnownParameters.RequestOptions]);
            var processMessageName = isAsync ? "ProcessMessageAsync" : "ProcessMessage";
            MethodBodyStatement[] methodBody =
            [
                UsingDeclare("message", typeof(PipelineMessage), This.Invoke("Create" + opName + "Request", [..methodParameters, ScmKnownParameters.RequestOptions]), out var message),
                Return(new InvokeStaticMethodExpression(
                    typeof(ClientResult),
                    nameof(ClientResult.FromResponse),
                    client.PipelineField.Invoke(processMessageName, [message, ScmKnownParameters.RequestOptions], isAsync, true))),
            ];

            var protocolMethod = new MethodProvider(methodSignature, methodBody, enclosingType);
            protocolMethod.XmlDocs!.Exceptions.Add(new(typeof(ClientResultException), "Service returned a non-success status code.", []));
            return protocolMethod;
        }

        private static CSharpType? GetResponseType(IReadOnlyList<OperationResponse> responses, bool isAsync)
        {
            var response = responses.FirstOrDefault(r => !r.IsErrorResponse);
            var returnType = response is null || response.BodyType is null
                ? typeof(ClientResult)
                : new CSharpType(typeof(ClientResult<>), ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(response.BodyType));
            if (isAsync)
            {
                returnType = new CSharpType(typeof(Task<>), returnType);
            }
            return returnType;
        }

        private static MethodProvider BuildCreateMessageMethod(InputOperation operation, TypeProvider enclosingType)
        {
            // TO-DO: properly build method https://github.com/Azure/autorest.csharp/issues/4583
            List<ParameterProvider> methodParameters = new();
            foreach (var inputParam in operation.Parameters)
            {
                if (inputParam.Kind != InputOperationParameterKind.Method)
                    continue;
                methodParameters.Add(ClientModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam));
            }

            var methodModifier = MethodSignatureModifiers.Internal;
            var methodSignatureName = $"Create{operation.Name.ToCleanName()}Request";
            var methodSignature = new MethodSignature(
                methodSignatureName,
                FormattableStringHelpers.FromString(operation.Description),
                methodModifier,
                typeof(PipelineMessage),
                null,
                Parameters: [..methodParameters, ScmKnownParameters.RequestOptions]);
            var methodBody = Throw(New.NotImplementedException(Literal("Method not implemented.")));

            return new MethodProvider(methodSignature, methodBody, enclosingType);
        }
    }
}

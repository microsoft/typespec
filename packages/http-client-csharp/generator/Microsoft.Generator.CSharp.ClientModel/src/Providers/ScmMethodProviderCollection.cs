// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using System.Linq;
using System.Threading.Tasks;
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
                null,
                Parameters: [.. methodParameters, KnownParameters.CancellationTokenParameter]);
            MethodBodyStatement[] methodBody =
            [
                //UsingDeclare("message", typeof(RequestMess)
                //using PipelineMessage message = CreateSayHiRequest(headParameter, queryParameter, optionalQuery, options);
                isAsync ? new InvokeStaticPropertyExpression(typeof(Task), nameof(Task.CompletedTask), true).Terminate() : EmptyStatement
            ];

            return new MethodProvider(methodSignature, methodBody, enclosingType);
        }

        private static CSharpType? GetResponseType(IReadOnlyList<OperationResponse> responses, bool isAsync)
        {
            var response = responses.FirstOrDefault(r => !r.IsErrorResponse);
            if (response is null || response.BodyType is null)
                return null;
            var returnType = ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(response.BodyType);
            if (isAsync)
            {
                returnType = returnType.WrapInTask();
            }
            return returnType;
        }

        private static MethodProvider BuildCreateMessageMethod(InputOperation operation, TypeProvider enclosingType)
        {
            // TO-DO: properly build method https://github.com/Azure/autorest.csharp/issues/4583
            List<ParameterProvider> methodParameters = new();
            foreach (var inputParam in operation.Parameters)
            {
                methodParameters.Add(ClientModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam));
            }

            var methodModifier = MethodSignatureModifiers.Internal;
            var methodSignatureName = $"Create{operation.Name.ToCleanName()}Request";
            var methodSignature = new MethodSignature(methodSignatureName, FormattableStringHelpers.FromString(operation.Description), methodModifier, null, null, Parameters: methodParameters);
            var methodBody = EmptyStatement;

            return new MethodProvider(methodSignature, methodBody, enclosingType);
        }
    }
}

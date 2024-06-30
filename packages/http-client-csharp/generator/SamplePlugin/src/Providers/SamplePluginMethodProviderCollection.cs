// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.SamplePlugin;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace SamplePlugin.Providers
{
    internal class SamplePluginMethodProviderCollection : ScmMethodProviderCollection
    {
        private string _cleanOperationName;
        private string _createRequestMethodName;
        private ParameterProvider? _bodyParameter;

        public SamplePluginMethodProviderCollection(InputOperation operation, TypeProvider enclosingType)
            : base(operation, enclosingType)
        {
            _cleanOperationName = operation.Name;
            _createRequestMethodName = "Create" + _cleanOperationName + "Request";
        }

        private List<ParameterProvider>? _methodParameters;
        private List<ParameterProvider> MethodParameters => _methodParameters ??= GetMethodParameters(false);

        private List<ParameterProvider>? _convenienceMethodParameters;
        private List<ParameterProvider> ConvenienceMethodParameters => _convenienceMethodParameters ??= GetMethodParameters(true);

        private List<ParameterProvider> GetMethodParameters(bool isConvenience)
        {
            List<ParameterProvider> methodParameters = new();
            foreach (InputParameter inputParam in _operation.Parameters)
            {
                if (inputParam.Kind != InputOperationParameterKind.Method)
                    continue;
                if (inputParam.Location == RequestLocation.Body)
                {
                    var parameter = isConvenience ? SampleCodeModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam) : SamplePluginKnownParameters.BinaryContent;
                    _bodyParameter = parameter;
                    methodParameters.Add(parameter);
                }
                else
                {
                    methodParameters.Add(SampleCodeModelPlugin.Instance.TypeFactory.CreateCSharpParam(inputParam));
                }
            }
            return methodParameters;
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
                : new CSharpType(typeof(ClientResult<>), SampleCodeModelPlugin.Instance.TypeFactory.CreateCSharpType(response.BodyType));
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
                Parameters: [.. MethodParameters, SamplePluginKnownParameters.RequestOptions]);
            var methodBody = Throw(New.NotImplementedException(Literal("Method not implemented.")));

            return new MethodProvider(methodSignature, methodBody, _enclosingType);
        }
    }
}

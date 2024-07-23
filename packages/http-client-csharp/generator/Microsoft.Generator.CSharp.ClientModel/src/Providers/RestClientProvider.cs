// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Primitives;
using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public class RestClientProvider : TypeProvider
    {
        private Dictionary<InputOperation, MethodProvider>? _methodCache;
        private Dictionary<InputOperation, MethodProvider> MethodCache => _methodCache ??= [];

        private readonly InputClient _inputClient;
        internal ClientProvider ClientProvider { get; }

        private FieldProvider _pipelineMessageClassifier200;
        private FieldProvider _pipelineMessageClassifier204;
        private FieldProvider _pipelineMessageClassifier2xxAnd4xx;
        private TypeProvider _classifier2xxAnd4xxDefinition;

        private PropertyProvider _classifier200Property;

        public RestClientProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            ClientProvider = clientProvider;
            _pipelineMessageClassifier200 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, typeof(PipelineMessageClassifier), "_pipelineMessageClassifier200");
            _pipelineMessageClassifier204 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, typeof(PipelineMessageClassifier), "_pipelineMessageClassifier204");
            _classifier2xxAnd4xxDefinition = new Classifier2xxAnd4xxDefinition(this);
            _pipelineMessageClassifier2xxAnd4xx = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, _classifier2xxAnd4xxDefinition.Type, "_pipelineMessageClassifier2xxAnd4xx");
            _classifier200Property = GetResponseClassifierProperty(_pipelineMessageClassifier200, 200);
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.RestClient.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

        protected override PropertyProvider[] BuildProperties()
        {
            return
            [
                _classifier200Property,
                GetResponseClassifierProperty(_pipelineMessageClassifier204, 204),
                new PropertyProvider(
                    $"Gets the PipelineMessageClassifier2xxAnd4xx",
                    MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                    _classifier2xxAnd4xxDefinition.Type,
                    "PipelineMessageClassifier2xxAnd4xx",
                    new ExpressionPropertyBody(_pipelineMessageClassifier2xxAnd4xx.Assign(New.Instance(_classifier2xxAnd4xxDefinition.Type), true)))
            ];
        }

        private PropertyProvider GetResponseClassifierProperty(FieldProvider pipelineMessageClassifier, int code)
        {
            return new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                    typeof(PipelineMessageClassifier),
                    pipelineMessageClassifier.Name.Substring(1).FirstCharToUpperCase(),
                    new ExpressionPropertyBody(
                        pipelineMessageClassifier.Assign(
                            Static<PipelineMessageClassifier>().Invoke(
                                nameof(PipelineMessageClassifier.Create),
                                [New.Array(typeof(ushort), true, true, [Literal(code)])]))));
        }

        protected override FieldProvider[] BuildFields()
        {
            return
            [
                _pipelineMessageClassifier200,
                _pipelineMessageClassifier204,
                _pipelineMessageClassifier2xxAnd4xx
            ];
        }

        protected override TypeProvider[] BuildNestedTypes()
        {
            return [_classifier2xxAnd4xxDefinition];
        }

        protected override MethodProvider[] BuildMethods()
        {
            List<MethodProvider> methods = new List<MethodProvider>();

            foreach (var operation in _inputClient.Operations)
            {
                var method = BuildCreateRequestMethod(operation);
                methods.Add(method);
                MethodCache[operation] = method;
            }

            return [.. methods];
        }

        private bool IsCreateRequest(MethodProvider method)
        {
            var span = method.Signature.Name.AsSpan();
            return span.StartsWith("Create", StringComparison.Ordinal) && span.EndsWith("Request", StringComparison.Ordinal);
        }

        private MethodProvider BuildCreateRequestMethod(InputOperation operation)
        {
            var pipelineField = ClientProvider.PipelineProperty.As<ClientPipeline>();

            var options = ScmKnownParameters.RequestOptions;
            var signature = new MethodSignature(
                $"Create{operation.Name.ToCleanName()}Request",
                null,
                MethodSignatureModifiers.Internal,
                typeof(PipelineMessage),
                null,
                [.. GetMethodParameters(operation), options]);
            var paramMap = new Dictionary<string, ParameterProvider>(signature.Parameters.ToDictionary(p => p.Name));

            return new MethodProvider(
                signature,
                new MethodBodyStatements(
                [
                    Declare("message", pipelineField.CreateMessage(), out ScopedApi<PipelineMessage> message),
                    message.ResponseClassifier().Assign(_classifier200Property).Terminate(),
                    Declare("request", message.Request(), out ScopedApi<PipelineRequest> request),
                    request.SetMethod(operation.HttpMethod),
                    Declare("uri", New.Instance<ClientUriBuilderDefinition>(), out ScopedApi<ClientUriBuilderDefinition> uri),
                    uri.Reset(ClientProvider.EndpointField).Terminate(),
                    .. AppendPathParameters(uri, operation, paramMap),
                    .. AppendQueryParameters(uri, operation, paramMap),
                    request.Uri().Assign(uri.ToUri()).Terminate(),
                    .. AppendHeaderParameters(request, operation, paramMap),
                    message.Apply(options).Terminate(),
                    Return(message)
                ]),
                this);
        }

        private IEnumerable<MethodBodyStatement> AppendHeaderParameters(ScopedApi<PipelineRequest> request, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            //TODO handle special headers like Repeatability-First-Sent which shouldn't be params but sent as DateTimeOffset.Now.ToString("R")
            //https://github.com/microsoft/typespec/issues/3936
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            foreach (var inputParameter in operation.Parameters)
            {
                if (inputParameter.Location != RequestLocation.Header)
                    continue;

                bool isString;
                string? format;
                ValueExpression valueExpression;
                GetParamInfo(paramMap, inputParameter, out isString, out format, out valueExpression);
                ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                valueExpression = isString ? valueExpression : valueExpression.Invoke(nameof(ToString), toStringParams);
                statements.Add(request.SetHeaderValue(inputParameter.NameInRequest, valueExpression.As<string>()));
            }

            return statements;
        }

        private IEnumerable<MethodBodyStatement> AppendQueryParameters(ScopedApi<ClientUriBuilderDefinition> uri, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            foreach (var inputParameter in operation.Parameters)
            {
                if (inputParameter.Location != RequestLocation.Query)
                    continue;

                bool isString;
                string? format;
                ValueExpression valueExpression;
                GetParamInfo(paramMap, inputParameter, out isString, out format, out valueExpression);
                ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                var toStringExpression = isString ? valueExpression : valueExpression.Invoke(nameof(ToString), toStringParams);
                var statement = uri.AppendQuery(Literal(inputParameter.NameInRequest), toStringExpression, true).Terminate();
                statement = inputParameter.IsRequired
                    ? statement
                    : new IfStatement(valueExpression.NotEqual(Null))
                    {
                        statement
                    };
                statements.Add(statement);
            }

            return statements;
        }

        private IEnumerable<MethodBodyStatement> AppendPathParameters(ScopedApi<ClientUriBuilderDefinition> uri, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            Dictionary<string, InputParameter> inputParamHash = new(operation.Parameters.ToDictionary(p => p.Name));
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            var pathSpan = operation.Path.AsSpan();
            while (pathSpan.Length > 0)
            {
                var paramIndex = pathSpan.IndexOf('{');
                if (paramIndex < 0)
                {
                    statements.Add(uri.AppendPath(Literal(pathSpan.ToString()), false).Terminate());
                    break;
                }

                statements.Add(uri.AppendPath(Literal(pathSpan.Slice(0, paramIndex).ToString()), false).Terminate());
                pathSpan = pathSpan.Slice(paramIndex + 1);
                var paramEndIndex = pathSpan.IndexOf('}');
                var paramName = pathSpan.Slice(0, paramEndIndex).ToString();
                var inputParam = inputParamHash[paramName];

                if (inputParam.Location == RequestLocation.Path)
                {
                    bool isString;
                    string? format;
                    ValueExpression valueExpression;
                    GetParamInfo(paramMap, inputParam, out isString, out format, out valueExpression);
                    ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                    valueExpression = isString ? valueExpression : valueExpression.Invoke(nameof(ToString), toStringParams);
                    statements.Add(uri.AppendPath(valueExpression, true).Terminate());
                }

                pathSpan = pathSpan.Slice(paramEndIndex + 1);
            }
            return statements;
        }

        private static void GetParamInfo(Dictionary<string, ParameterProvider> paramMap, InputParameter inputParam, out bool isString, out string? format, out ValueExpression valueExpression)
        {
            isString = ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(inputParam.Type).Equals(typeof(string));
            if (inputParam.Kind == InputOperationParameterKind.Constant)
            {
                valueExpression = Literal(inputParam.DefaultValue?.Value);
                format = ClientModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputParam.Type).ToFormatSpecifier();
            }
            else
            {
                var paramProvider = paramMap[inputParam.Name];
                valueExpression = paramProvider;
                format = paramProvider.WireInfo.SerializationFormat.ToFormatSpecifier();
            }
        }

        internal MethodProvider GetCreateRequestMethod(InputOperation operation)
        {
            _ = Methods; // Ensure methods are built
            return MethodCache[operation];
        }

        private List<ParameterProvider> GetMethodParameters(InputOperation operation)
        {
            List<ParameterProvider> methodParameters = new();
            foreach (InputParameter inputParam in operation.Parameters)
            {
                if (inputParam.Kind != InputOperationParameterKind.Method)
                    continue;

                ParameterProvider parameter = inputParam.Location == RequestLocation.Body
                    ? ScmKnownParameters.BinaryContent
                    : ClientModelPlugin.Instance.TypeFactory.CreateParameter(inputParam);
                methodParameters.Add(parameter);
            }
            return methodParameters;
        }
    }
}

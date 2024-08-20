// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Net.Http;
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
        private PropertyProvider _classifier204Property;
        private PropertyProvider _classifier2xxAnd4xxProperty;

        public RestClientProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            ClientProvider = clientProvider;
            _pipelineMessageClassifier200 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, typeof(PipelineMessageClassifier), "_pipelineMessageClassifier200");
            _pipelineMessageClassifier204 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, typeof(PipelineMessageClassifier), "_pipelineMessageClassifier204");
            _classifier2xxAnd4xxDefinition = new Classifier2xxAnd4xxDefinition(this);
            _pipelineMessageClassifier2xxAnd4xx = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, _classifier2xxAnd4xxDefinition.Type, "_pipelineMessageClassifier2xxAnd4xx");
            _classifier200Property = GetResponseClassifierProperty(_pipelineMessageClassifier200, 200);
            _classifier204Property = GetResponseClassifierProperty(_pipelineMessageClassifier204, 204);
            _classifier2xxAnd4xxProperty = new PropertyProvider(
                $"Gets the PipelineMessageClassifier2xxAnd4xx",
                MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                _classifier2xxAnd4xxDefinition.Type,
                "PipelineMessageClassifier2xxAnd4xx",
                new ExpressionPropertyBody(_pipelineMessageClassifier2xxAnd4xx.Assign(New.Instance(_classifier2xxAnd4xxDefinition.Type), true)));
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.RestClient.cs");

        protected override string BuildName() => _inputClient.Name.ToCleanName();

        protected override PropertyProvider[] BuildProperties()
        {
            return
            [
                _classifier200Property,
                _classifier204Property,
                _classifier2xxAnd4xxProperty
            ];
        }

        private PropertyProvider GetResponseClassifierProperty(FieldProvider pipelineMessageClassifier, int code)
        {
            return new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                    typeof(PipelineMessageClassifier),
                    pipelineMessageClassifier.Name.Substring(1).ToCleanName(),
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
                [.. GetMethodParameters(operation, true), options]);
            var paramMap = new Dictionary<string, ParameterProvider>(signature.Parameters.ToDictionary(p => p.Name));
            foreach (var param in ClientProvider.GetUriParameters())
            {
                paramMap[param.Name] = param;
            }

            var classifier = GetClassifier(operation);

            return new MethodProvider(
                signature,
                new MethodBodyStatements(
                [
                    Declare("message", pipelineField.CreateMessage(), out ScopedApi<PipelineMessage> message),
                    message.ResponseClassifier().Assign(classifier).Terminate(),
                    Declare("request", message.Request(), out ScopedApi<PipelineRequest> request),
                    request.SetMethod(operation.HttpMethod),
                    Declare("uri", New.Instance<ClientUriBuilderDefinition>(), out ScopedApi<ClientUriBuilderDefinition> uri),
                    uri.Reset(ClientProvider.EndpointField).Terminate(),
                    .. AppendPathParameters(uri, operation, paramMap),
                    .. AppendQueryParameters(uri, operation, paramMap),
                    request.Uri().Assign(uri.ToUri()).Terminate(),
                    .. AppendHeaderParameters(request, operation, paramMap),
                    .. GetSetContent(request, signature.Parameters),
                    message.Apply(options).Terminate(),
                    Return(message)
                ]),
                this);
        }

        private IReadOnlyList<MethodBodyStatement> GetSetContent(ScopedApi<PipelineRequest> request, IReadOnlyList<ParameterProvider> parameters)
        {
            var contentParam = parameters.FirstOrDefault(p => ReferenceEquals(p, ScmKnownParameters.BinaryContent));
            return contentParam is null ? [] : [request.SetContent(contentParam)];
        }

        private PropertyProvider GetClassifier(InputOperation operation)
        {
            if (operation.HttpMethod == HttpMethod.Head.ToString())
                return _classifier2xxAnd4xxProperty;

            var response = operation.Responses.First(r => !r.IsErrorResponse); //should only be one of these

            if (response.StatusCodes.Count == 1)
            {
                return response.StatusCodes[0] switch
                {
                    200 => _classifier200Property,
                    204 => _classifier204Property,
                    _ => throw new InvalidOperationException($"Unexpected status code {response.StatusCodes[0]}")
                };
            }

            throw new InvalidOperationException("Multiple status codes not supported");
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

                CSharpType? type;
                string? format;
                ValueExpression valueExpression;
                GetParamInfo(paramMap, inputParameter, out type, out format, out valueExpression);
                ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                ValueExpression toStringExpression = type?.Equals(typeof(string)) == true ? valueExpression : valueExpression.Invoke(nameof(ToString), toStringParams);
                MethodBodyStatement statement;
                if (type?.Equals(typeof(BinaryData)) == true)
                {
                    statement = request.SetHeaderValue(
                        inputParameter.NameInRequest,
                        TypeFormattersSnippets.ToString(valueExpression.Invoke("ToArray"), Literal(format)));
                }
                else if (type?.Equals(typeof(IList<BinaryData>)) == true)
                {
                    statement =
                        new ForeachStatement("item", valueExpression.As<IEnumerable<BinaryData>>(), out var item)
                        {
                            request.AddHeaderValue(inputParameter.NameInRequest, TypeFormattersSnippets.ToString(item.Invoke("ToArray"),
                                Literal(format)))
                        };
                }
                else
                {
                    statement = request.SetHeaderValue(inputParameter.NameInRequest, toStringExpression.As<string>());
                }
                statements.Add(statement);
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

                string? format;
                ValueExpression valueExpression;
                GetParamInfo(paramMap, inputParameter, out var type, out format, out valueExpression);
                ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                var toStringExpression = type?.Equals(typeof(string)) == true ? valueExpression : valueExpression.Invoke(nameof(ToString), toStringParams);
                MethodBodyStatement statement;
                if (type?.Equals(typeof(BinaryData)) == true)
                {
                    statement = uri.AppendQuery(Literal(inputParameter.NameInRequest),
                        valueExpression.Invoke("ToArray"), format, true).Terminate();
                }
                else if (type?.Equals(typeof(IList<BinaryData>)) == true)
                {
                    statement = uri.AppendQueryDelimited(Literal(inputParameter.NameInRequest),
                        valueExpression, format, true).Terminate();
                }
                else
                {
                    statement = uri.AppendQuery(Literal(inputParameter.NameInRequest), toStringExpression, true)
                        .Terminate();
                }

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
            string? endpoint = ClientProvider.EndpointParameterName;
            int uriOffset = endpoint is null || !operation.Uri.StartsWith(endpoint, StringComparison.Ordinal) ? 0 : endpoint.Length;
            AddUriSegments(operation.Uri, uriOffset, uri, statements, inputParamHash, paramMap);
            AddUriSegments(operation.Path, 0, uri, statements, inputParamHash, paramMap);
            return statements;
        }

        private void AddUriSegments(
            string segments,
            int offset,
            ScopedApi<ClientUriBuilderDefinition> uri,
            List<MethodBodyStatement> statements,
            Dictionary<string, InputParameter> inputParamHash,
            Dictionary<string, ParameterProvider> paramMap)
        {
            var pathSpan = segments.AsSpan().Slice(offset);
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

                if (inputParam.Location == RequestLocation.Path || inputParam.Location == RequestLocation.Uri)
                {
                    CSharpType? type;
                    string? format;
                    ValueExpression valueExpression;
                    GetParamInfo(paramMap, inputParam, out type, out format, out valueExpression);
                    ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                    valueExpression = type?.Equals(typeof(string)) == true ? valueExpression : valueExpression.Invoke(nameof(ToString), toStringParams);
                    statements.Add(uri.AppendPath(valueExpression, true).Terminate());
                }

                pathSpan = pathSpan.Slice(paramEndIndex + 1);
            }
        }

        private static void GetParamInfo(Dictionary<string, ParameterProvider> paramMap, InputParameter inputParam, out CSharpType? type, out string? format, out ValueExpression valueExpression)
        {
            type = ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(inputParam.Type);
            if (inputParam.Kind == InputOperationParameterKind.Constant)
            {
                valueExpression = Literal((inputParam.Type as InputLiteralType)?.Value);
                format = ClientModelPlugin.Instance.TypeFactory.GetSerializationFormat(inputParam.Type).ToFormatSpecifier();
            }
            else
            {
                var paramProvider = paramMap[inputParam.Name];
                if (paramProvider.Type.IsEnum)
                {
                    var csharpType = paramProvider.Field is null ? paramProvider.Type : paramProvider.Field.Type;
                    valueExpression = csharpType.ToSerial(paramProvider);
                    format = null;
                }
                else
                {
                    valueExpression = paramProvider.Field is null ? paramProvider : paramProvider.Field;
                    format = paramProvider.WireInfo.SerializationFormat.ToFormatSpecifier();
                }
            }
        }

        private static IReadOnlyList<ParameterProvider> BuildSpreadParametersForModel(InputModelType inputModel)
        {
            var provider = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
            if (provider is null)
                return [];

            var builtParameters = new List<ParameterProvider>();

            foreach (var property in provider.Properties)
            {
                var wireInfo = property.WireInfo;
                if (wireInfo is null)
                    continue;

                var param = property.AsParameter;
                ValueExpression? defaultValue = !wireInfo.IsRequired ? Default : null;

                builtParameters.Add(new(
                    param.Name,
                    param.Description,
                    param.Type.InputType,
                    defaultValue,
                    param.IsRef,
                    param.IsOut,
                    [],
                    param.Property,
                    param.Field,
                    param.InitializationValue)
                {
                    Validation = param.Validation
                });
            }

            return [.. builtParameters.OrderBy(p => p.DefaultValue == null ? 0 : 1)];
        }

        internal MethodProvider GetCreateRequestMethod(InputOperation operation)
        {
            _ = Methods; // Ensure methods are built
            return MethodCache[operation];
        }

        internal static List<ParameterProvider> GetMethodParameters(InputOperation operation, bool isProtocol = false)
        {
            List<ParameterProvider> orderedParams = new(operation.Parameters.Count);
            List<ParameterProvider> pathParams = [];
            List<ParameterProvider> requiredRequestParams = [];
            List<ParameterProvider> optionalRequestParams = [];
            List<ParameterProvider> paramsFromSpreadModel = [];
            ParameterProvider? bodyParameter = null;
            ParameterProvider? contentTypeParam = null;

            foreach (InputParameter inputParam in operation.Parameters)
            {
                InputModelType? spreadInputModel = null;
                if ((inputParam.Kind != InputOperationParameterKind.Method) && !TryGetSpreadParameterModel(inputParam, out spreadInputModel))
                    continue;

                ParameterProvider? parameter = ClientModelPlugin.Instance.TypeFactory.CreateParameter(inputParam);

                if (isProtocol)
                {
                    if (inputParam.Location == RequestLocation.Body)
                    {
                        parameter = ScmKnownParameters.BinaryContent;
                    }
                    else
                    {
                        parameter.Type = parameter.Type.IsEnum ? parameter.Type.UnderlyingEnumType : parameter.Type;
                    }
                }
                else if (spreadInputModel != null)
                {
                    paramsFromSpreadModel.AddRange(BuildSpreadParametersForModel(spreadInputModel));
                    continue;
                }

                if (parameter is null)
                    continue;

                switch (parameter.Location)
                {
                    case ParameterLocation.Path:
                    case ParameterLocation.Uri:
                        pathParams.Add(parameter);
                        break;
                    case ParameterLocation.Query:
                    case ParameterLocation.Header:
                        if (inputParam.IsContentType)
                        {
                            contentTypeParam = parameter;
                        }
                        else if (parameter.Validation != ParameterValidationType.None)
                        {
                            requiredRequestParams.Add(parameter);
                        }
                        else
                        {
                            optionalRequestParams.Add(parameter);
                        }
                        break;
                    case ParameterLocation.Body:
                        bodyParameter = parameter;
                        break;
                    default:
                        optionalRequestParams.Add(parameter);
                        break;
                }
            }

            orderedParams.AddRange(pathParams);
            orderedParams.AddRange(requiredRequestParams);
            if (bodyParameter is not null)
            {
                orderedParams.Add(bodyParameter);
            }
            if (contentTypeParam is not null)
            {
                orderedParams.Add(contentTypeParam);
            }
            orderedParams.AddRange(paramsFromSpreadModel);
            orderedParams.AddRange(optionalRequestParams);

            return orderedParams;
        }

        internal static bool TryGetSpreadParameterModel(InputParameter inputParam, [NotNullWhen(true)] out InputModelType? inputModel)
        {
            inputModel = null;
            if (inputParam.Kind.HasFlag(InputOperationParameterKind.Spread) && inputParam.Type is InputModelType model)
            {
                inputModel = model;
                return true;
            }

            return false;
        }
    }
}

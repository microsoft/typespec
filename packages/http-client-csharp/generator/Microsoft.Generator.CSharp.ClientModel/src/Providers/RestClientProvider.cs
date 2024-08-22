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
        private const string RepeatabilityRequestIdHeader = "Repeatability-Request-ID";
        private const string RepeatabilityFirstSentHeader = "Repeatability-First-Sent";
        private static readonly Dictionary<string, ParameterProvider> _knownSpecialHeaderParams = new(StringComparer.OrdinalIgnoreCase)
        {
            { RepeatabilityRequestIdHeader, ScmKnownParameters.RepeatabilityRequestId },
            { RepeatabilityFirstSentHeader, ScmKnownParameters.RepeatabilityFirstSent }
        };
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
            _pipelineMessageClassifier200 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, typeof(PipelineMessageClassifier), "_pipelineMessageClassifier200", this);
            _pipelineMessageClassifier204 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, typeof(PipelineMessageClassifier), "_pipelineMessageClassifier204", this);
            _classifier2xxAnd4xxDefinition = new Classifier2xxAnd4xxDefinition(this);
            _pipelineMessageClassifier2xxAnd4xx = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, _classifier2xxAnd4xxDefinition.Type, "_pipelineMessageClassifier2xxAnd4xx", this);
            _classifier200Property = GetResponseClassifierProperty(_pipelineMessageClassifier200, 200);
            _classifier204Property = GetResponseClassifierProperty(_pipelineMessageClassifier204, 204);
            _classifier2xxAnd4xxProperty = new PropertyProvider(
                $"Gets the PipelineMessageClassifier2xxAnd4xx",
                MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                _classifier2xxAnd4xxDefinition.Type,
                "PipelineMessageClassifier2xxAnd4xx",
                new ExpressionPropertyBody(_pipelineMessageClassifier2xxAnd4xx.Assign(New.Instance(_classifier2xxAnd4xxDefinition.Type), true)),
                this);
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
                                [New.Array(typeof(ushort), true, true, [Literal(code)])]))),
                    this);
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
            else if (TryGetSpecialHeaderParam(inputParam, out var parameterProvider))
            {
                valueExpression = parameterProvider.DefaultValue!;
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
            var builtParameters = new ParameterProvider[inputModel.Properties.Count];

            int index = 0;
            foreach (var property in inputModel.Properties)
            {
                // convert the property to a parameter
                var inputParameter = new InputParameter(
                    property.Name,
                    property.SerializedName,
                    property.Description,
                    property.Type,
                    RequestLocation.Body,
                    null,
                    InputOperationParameterKind.Method,
                    property.IsRequired,
                    false,
                    false,
                    false,
                    false,
                    false,
                    false,
                    null,
                    null);

                var paramProvider = ClientModelPlugin.Instance.TypeFactory.CreateParameter(inputParameter);
                paramProvider.DefaultValue = !inputParameter.IsRequired ? Default : null;
                paramProvider.SpreadSource = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);
                paramProvider.Type = paramProvider.Type.InputType;

                builtParameters[index++] = paramProvider;
            }

            return builtParameters;
        }

        private static bool TryGetSpecialHeaderParam(InputParameter inputParameter, [NotNullWhen(true)] out ParameterProvider? parameterProvider)
        {
            if (inputParameter.Location == RequestLocation.Header)
            {
                return _knownSpecialHeaderParams.TryGetValue(inputParameter.NameInRequest, out parameterProvider);
            }

            parameterProvider = null;
            return false;
        }

        internal MethodProvider GetCreateRequestMethod(InputOperation operation)
        {
            _ = Methods; // Ensure methods are built
            return MethodCache[operation];
        }

        internal static List<ParameterProvider> GetMethodParameters(InputOperation operation, bool isProtocol = false)
        {
            SortedList<int, ParameterProvider> sortedParams = [];
            int path = 0;
            int required = 100;
            int bodyRequired = 200;
            int bodyOptional = 300;
            int contentType = 400;
            int optional = 500;

            foreach (InputParameter inputParam in operation.Parameters)
            {
                if ((inputParam.Kind != InputOperationParameterKind.Method && inputParam.Kind != InputOperationParameterKind.Spread)
                    || TryGetSpecialHeaderParam(inputParam, out var _))
                    continue;

                var spreadInputModel = inputParam.Kind == InputOperationParameterKind.Spread ? GetSpreadParameterModel(inputParam) : null;

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
                    foreach (var bodyParam in BuildSpreadParametersForModel(spreadInputModel))
                    {
                        if (bodyParam.DefaultValue is null)
                        {
                            sortedParams.Add(bodyRequired++, bodyParam);
                        }
                        else
                        {
                            sortedParams.Add(bodyOptional++, bodyParam);
                        }
                    }
                    continue;
                }

                if (parameter is null)
                    continue;

                switch (parameter.Location)
                {
                    case ParameterLocation.Path:
                    case ParameterLocation.Uri:
                        sortedParams.Add(path++, parameter);
                        break;
                    case ParameterLocation.Query:
                    case ParameterLocation.Header:
                        if (inputParam.IsContentType)
                        {
                            sortedParams.Add(contentType++, parameter);
                        }
                        else if (parameter.Validation != ParameterValidationType.None)
                        {
                            sortedParams.Add(required++, parameter);
                        }
                        else
                        {
                            sortedParams.Add(optional++, parameter);
                        }
                        break;
                    case ParameterLocation.Body:
                        sortedParams.Add(bodyRequired++, parameter);
                        break;
                    default:
                        sortedParams.Add(optional++, parameter);
                        break;
                }
            }

            return [.. sortedParams.Values];
        }

        internal static InputModelType GetSpreadParameterModel(InputParameter inputParam)
        {
            if (inputParam.Kind.HasFlag(InputOperationParameterKind.Spread) && inputParam.Type is InputModelType model)
            {
                return model;
            }

            throw new InvalidOperationException($"inputParam `{inputParam.Name}` is `Spread` but not a model type");
        }
    }
}

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
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
        private FieldProvider _pipelineMessageClassifier201;
        private FieldProvider _pipelineMessageClassifier204;
        private FieldProvider _pipelineMessageClassifier2xxAnd4xx;
        private TypeProvider _classifier2xxAnd4xxDefinition;

        private PropertyProvider _classifier201Property;
        private PropertyProvider _classifier200Property;
        private PropertyProvider _classifier204Property;
        private PropertyProvider _classifier2xxAnd4xxProperty;

        public RestClientProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            ClientProvider = clientProvider;
            _pipelineMessageClassifier200 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, ClientModelPlugin.Instance.TypeFactory.StatusCodeClassifierApi.ResponseClassifierType, "_pipelineMessageClassifier200", this);
            _pipelineMessageClassifier201 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, ClientModelPlugin.Instance.TypeFactory.StatusCodeClassifierApi.ResponseClassifierType, "_pipelineMessageClassifier201", this);
            _pipelineMessageClassifier204 = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, ClientModelPlugin.Instance.TypeFactory.StatusCodeClassifierApi.ResponseClassifierType, "_pipelineMessageClassifier204", this);
            _classifier2xxAnd4xxDefinition = new Classifier2xxAnd4xxDefinition(this);
            _pipelineMessageClassifier2xxAnd4xx = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, _classifier2xxAnd4xxDefinition.Type, "_pipelineMessageClassifier2xxAnd4xx", this);
            _classifier200Property = GetResponseClassifierProperty(_pipelineMessageClassifier200, 200);
            _classifier201Property = GetResponseClassifierProperty(_pipelineMessageClassifier201, 201);
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
                _classifier201Property,
                _classifier204Property,
                _classifier2xxAnd4xxProperty
            ];
        }

        private PropertyProvider GetResponseClassifierProperty(FieldProvider pipelineMessageClassifier, int code)
        {
            return new PropertyProvider(
                    null,
                    MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                    ClientModelPlugin.Instance.TypeFactory.StatusCodeClassifierApi.ResponseClassifierType,
                    pipelineMessageClassifier.Name.Substring(1).ToCleanName(),
                    new ExpressionPropertyBody(
                        pipelineMessageClassifier.Assign(This.ToApi<StatusCodeClassifierApi>().Create(code))),
                    this);
        }

        protected override FieldProvider[] BuildFields()
        {
            return
            [
                _pipelineMessageClassifier200,
                _pipelineMessageClassifier201,
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
            var pipelineField = ClientProvider.PipelineProperty.ToApi<ClientPipelineApi>();

            var options = ScmKnownParameters.RequestOptions;
            var parameters = GetMethodParameters(operation, MethodType.CreateRequest);

            var signature = new MethodSignature(
                $"Create{operation.Name.ToCleanName()}Request",
                null,
                MethodSignatureModifiers.Internal,
                ClientModelPlugin.Instance.TypeFactory.HttpMessageApi.HttpMessageType,
                null,
                [.. parameters, options]);
            var paramMap = new Dictionary<string, ParameterProvider>(signature.Parameters.ToDictionary(p => p.Name));

            foreach (var param in ClientProvider.GetClientParameters())
            {
                paramMap[param.Name] = param;
            }

            var classifier = GetClassifier(operation);

            return new MethodProvider(
                signature,
                new MethodBodyStatements(
                [
                    Declare("message", pipelineField.CreateMessage(options.ToApi<HttpRequestOptionsApi>(), classifier).ToApi<HttpMessageApi>(), out HttpMessageApi message),
                    message.ApplyResponseClassifier(classifier.ToApi<StatusCodeClassifierApi>()),
                    Declare("request", message.Request().ToApi<HttpRequestApi>(), out HttpRequestApi request),
                    request.SetMethod(operation.HttpMethod),
                    Declare("uri", New.Instance(request.UriBuilderType), out ScopedApi uri),
                    uri.Reset(ClientProvider.EndpointField).Terminate(),
                    .. AppendPathParameters(uri, operation, paramMap),
                    .. AppendQueryParameters(uri, operation, paramMap),
                    request.SetUri(uri),
                    .. AppendHeaderParameters(request, operation, paramMap),
                    .. GetSetContent(request, signature.Parameters),
                    message.ApplyRequestOptions(options.ToApi<HttpRequestOptionsApi>()),
                    Return(message)
                ]),
                this);
        }

        private IReadOnlyList<MethodBodyStatement> GetSetContent(HttpRequestApi request, IReadOnlyList<ParameterProvider> parameters)
        {
            var contentParam = parameters.FirstOrDefault(
                p => ReferenceEquals(p, ScmKnownParameters.RequestContent) || ReferenceEquals(p, ScmKnownParameters.OptionalRequestContent));
            return contentParam is null ? [] : [request.Content().Assign(contentParam).Terminate()];
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
                    201 => _classifier201Property,
                    204 => _classifier204Property,
                    _ => throw new InvalidOperationException($"Unexpected status code {response.StatusCodes[0]}")
                };
            }

            throw new InvalidOperationException("Multiple status codes not supported");
        }

        private IEnumerable<MethodBodyStatement> AppendHeaderParameters(HttpRequestApi request, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            foreach (var inputParameter in operation.Parameters)
            {
                if (inputParameter.Location != RequestLocation.Header)
                    continue;

                CSharpType? type;
                string? format;
                ValueExpression valueExpression;
                GetParamInfo(paramMap, operation, inputParameter, out type, out format, out valueExpression);
                var convertToStringExpression = TypeFormattersSnippets.ConvertToString(valueExpression, Literal(format));
                ValueExpression toStringExpression = type?.Equals(typeof(string)) == true ? valueExpression : convertToStringExpression;
                MethodBodyStatement statement;
                if (type?.IsCollection == true)
                {
                    statement = request.SetHeaderDelimited(inputParameter.NameInRequest, valueExpression, Literal(inputParameter.ArraySerializationDelimiter), format != null ? Literal(format) : null);
                }
                else
                {
                    statement = request.SetHeaders([Literal(inputParameter.NameInRequest), toStringExpression.As<string>()]);
                }
                statements.Add(statement);
            }

            return statements;
        }

        private static List<MethodBodyStatement> AppendQueryParameters(ScopedApi uri, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            foreach (var inputParameter in operation.Parameters)
            {
                if (inputParameter.Location != RequestLocation.Query)
                    continue;

                string? format;
                ValueExpression valueExpression;
                GetParamInfo(paramMap, operation, inputParameter, out var paramType, out format, out valueExpression);
                var convertToStringExpression = TypeFormattersSnippets.ConvertToString(valueExpression, Literal(format));
                ValueExpression toStringExpression = paramType?.Equals(typeof(string)) == true ? valueExpression : convertToStringExpression;
                MethodBodyStatement statement;

                if (paramType?.IsCollection == true)
                {
                    var delimiter = inputParameter.ArraySerializationDelimiter;

                    if (inputParameter.Type is InputDictionaryType)
                    {
                        if (inputParameter.Explode)
                        {
                            statement = new ForeachStatement("param", valueExpression.AsDictionary(paramType),
                                out KeyValuePairExpression item)
                            {
                                uri.AppendQuery(item.Key, item.Value, true).Terminate()
                            };
                        }
                        else
                        {
                            statement = new[]
                            {
                                Declare("list", New.List<object>(), out var list),
                                new ForeachStatement("param", valueExpression.AsDictionary(paramType), out KeyValuePairExpression item)
                                {
                                    list.Add(item.Key),
                                    list.Add(item.Value)
                                },
                                uri.AppendQueryDelimited(Literal(inputParameter.NameInRequest), list, format, true)
                                    .Terminate()
                            };
                        }
                    }
                    else if (!inputParameter.Explode)
                    {
                        statement = uri.AppendQueryDelimited(Literal(inputParameter.NameInRequest), valueExpression, format, true, delimiter: delimiter).Terminate();
                    }
                    else
                    {
                        statement = new ForeachStatement("param", valueExpression.As(paramType), out VariableExpression item)
                        {
                            uri.AppendQuery(Literal(inputParameter.NameInRequest), item, true).Terminate()
                        };
                    }
                }
                else
                {
                    statement = uri.AppendQuery(Literal(inputParameter.NameInRequest), toStringExpression, true)
                        .Terminate();
                }

                if (!inputParameter.IsRequired || paramType?.IsNullable == true ||
                    (paramType is { IsValueType: false, IsFrameworkType: true } && paramType.FrameworkType != typeof(string)))
                {
                    statement = BuildQueryParameterNullCheck(paramType, valueExpression, statement);
                }

                statements.Add(statement);
            }

            return statements;
        }

        private static IfStatement BuildQueryParameterNullCheck(
            CSharpType? parameterType,
            ValueExpression valueExpression,
            MethodBodyStatement originalStatement)
        {
            if (parameterType?.IsCollection == true)
            {
                DeclarationExpression? changeTrackingCollectionDeclaration;
                VariableExpression? changeTrackingReference;
                if (parameterType.IsDictionary)
                {
                    changeTrackingCollectionDeclaration = Declare(
                        "changeTrackingDictionary",
                        ClientModelPlugin.Instance.TypeFactory.DictionaryInitializationType.MakeGenericType(parameterType.Arguments),
                        out changeTrackingReference);
                }
                else
                {
                    changeTrackingCollectionDeclaration = Declare(
                        "changeTrackingList",
                        ClientModelPlugin.Instance.TypeFactory.ListInitializationType.MakeGenericType(parameterType
                            .Arguments),
                        out changeTrackingReference);
                }

                return new IfStatement(valueExpression.NotEqual(Null)
                    .And(Not(valueExpression.Is(changeTrackingCollectionDeclaration)
                    .And(changeTrackingReference.Property("IsUndefined")))))
                {
                    originalStatement
                };
            }

            return new IfStatement(valueExpression.NotEqual(Null)) { originalStatement };
        }

        private IEnumerable<MethodBodyStatement> AppendPathParameters(ScopedApi uri, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            Dictionary<string, InputParameter> inputParamHash = new(operation.Parameters.ToDictionary(p => p.Name));
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);
            string? endpoint = ClientProvider.EndpointParameterName;
            int uriOffset = endpoint is null || !operation.Uri.StartsWith(endpoint, StringComparison.Ordinal) ? 0 : endpoint.Length;
            AddUriSegments(operation.Uri, uriOffset, uri, statements, inputParamHash, paramMap, operation);
            AddUriSegments(operation.Path, 0, uri, statements, inputParamHash, paramMap, operation);
            return statements;
        }

        private void AddUriSegments(
            string segments,
            int offset,
            ScopedApi uri,
            List<MethodBodyStatement> statements,
            Dictionary<string, InputParameter> inputParamHash,
            Dictionary<string, ParameterProvider> paramMap,
            InputOperation operation)
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
                /* when the parameter is in operation.uri, it is client parameter
                 * It is not operation parameter and not in inputParamHash list.
                 */
                var isClientParameter = ClientProvider.GetClientParameters().Any(p => p.Name == paramName);
                CSharpType? type;
                string? format;
                ValueExpression valueExpression;
                InputParameter? inputParam = null;
                if (isClientParameter)
                {
                    GetParamInfo(paramMap[paramName], out type, out format, out valueExpression);
                }
                else
                {
                    inputParam = inputParamHash[paramName];
                    if (inputParam.Location == RequestLocation.Path || inputParam.Location == RequestLocation.Uri)
                    {
                        GetParamInfo(paramMap, operation, inputParam, out type, out format, out valueExpression);
                    }
                    else
                    {
                        throw new InvalidOperationException($"The location of parameter {inputParam.Name} should be path or uri");
                    }
                }
                ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                bool escape = !inputParam?.SkipUrlEncoding ?? true;
                if (type?.OutputType.IsCollection == true)
                {
                    statements.Add(uri.AppendPathDelimited(
                        valueExpression, format, escape, inputParam?.ArraySerializationDelimiter).Terminate());
                }
                else
                {
                    valueExpression = type?.Equals(typeof(string)) == true
                        ? valueExpression
                        : valueExpression.Invoke(nameof(ToString), toStringParams);
                    statements.Add(uri.AppendPath(valueExpression, escape).Terminate());
                }

                pathSpan = pathSpan.Slice(paramEndIndex + 1);
            }
        }

        private static void GetParamInfo(Dictionary<string, ParameterProvider> paramMap, InputOperation operation, InputParameter inputParam, out CSharpType? type, out string? format, out ValueExpression valueExpression)
        {
            type = ClientModelPlugin.Instance.TypeFactory.CreateCSharpType(inputParam.Type);
            if (inputParam.Kind == InputOperationParameterKind.Constant && !(operation.IsMultipartFormData && inputParam.IsContentType))
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
                GetParamInfo(paramProvider, out type, out format, out valueExpression);
            }
        }

        private static void GetParamInfo(ParameterProvider paramProvider, out CSharpType? type, out string? format, out ValueExpression valueExpression)
        {
            type = paramProvider.Field is null ? paramProvider.Type : paramProvider.Field.Type;
            if (type.IsEnum)
            {
                valueExpression = type.ToSerial(paramProvider);
                format = null;
            }
            else
            {
                valueExpression = paramProvider.Field is null ? paramProvider : paramProvider.Field;
                format = paramProvider.WireInfo.SerializationFormat.ToFormatSpecifier();
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

                var paramProvider = ClientModelPlugin.Instance.TypeFactory.CreateParameter(inputParameter).ToPublicInputParameter();
                paramProvider.DefaultValue = !inputParameter.IsRequired ? Default : null;
                paramProvider.SpreadSource = ClientModelPlugin.Instance.TypeFactory.CreateModel(inputModel);

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

        internal static List<ParameterProvider> GetMethodParameters(InputOperation operation, MethodType methodType)
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

                ParameterProvider? parameter = ClientModelPlugin.Instance.TypeFactory.CreateParameter(inputParam).ToPublicInputParameter();

                if (methodType is MethodType.Protocol or MethodType.CreateRequest)
                {
                    if (inputParam.Location == RequestLocation.Body)
                    {
                        if (methodType == MethodType.CreateRequest)
                        {
                            parameter = ScmKnownParameters.RequestContent;
                        }
                        else
                        {
                            parameter = parameter.DefaultValue == null
                                ? ScmKnownParameters.RequestContent
                                : ScmKnownParameters.OptionalRequestContent;
                        }
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
                        sortedParams.Add(parameter.DefaultValue == null ? bodyRequired++ : bodyOptional++, parameter);
                        break;
                    default:
                        sortedParams.Add(optional++, parameter);
                        break;
                }
            }

            if (operation.IsMultipartFormData)
            {
                sortedParams.Add(bodyRequired++, ScmKnownParameters.ContentType);
            }

            // All the parameters should be required for the CreateRequest method
            if (methodType == MethodType.CreateRequest)
            {
                foreach (var parameter in sortedParams.Values)
                {
                    parameter.DefaultValue = null;
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

        internal enum MethodType
        {
            CreateRequest,
            Protocol,
            Convenience
        }
    }
}

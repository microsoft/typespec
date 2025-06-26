// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
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
        private Dictionary<InputOperation, MethodProvider>? _nextMethodCache;
        private Dictionary<InputOperation, MethodProvider> NextMethodCache => _nextMethodCache ??= [];

        private readonly Dictionary<List<int>, PropertyProvider> _pipelineMessage20xClassifiers;
        private readonly InputClient _inputClient;

        public RestClientProvider(InputClient inputClient, ClientProvider clientProvider)
        {
            _inputClient = inputClient;
            ClientProvider = clientProvider;
            _pipelineMessage20xClassifiers = BuildPipelineMessage20xClassifiers();
        }

        internal ClientProvider ClientProvider { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.RestClient.cs");

        protected override string BuildName() => _inputClient.Name.ToIdentifierName();

        protected override string BuildNamespace() => ClientProvider.Type.Namespace;

        protected override PropertyProvider[] BuildProperties()
        {
            return [.. _pipelineMessage20xClassifiers.Values.OrderBy(v => v.Name)];
        }

        protected override FieldProvider[] BuildFields()
        {
            List<FieldProvider> pipelineMessage20xClassifiersFields = new(_pipelineMessage20xClassifiers.Count);
            var orderedClassifierProperties = _pipelineMessage20xClassifiers.Values.OrderBy(v => v.Name);

            foreach (var classifierProperty in orderedClassifierProperties)
            {
                if (classifierProperty.BackingField != null)
                {
                    pipelineMessage20xClassifiersFields.Add(classifierProperty.BackingField);
                }
            }

            return [.. pipelineMessage20xClassifiersFields];
        }

        protected override ScmMethodProvider[] BuildMethods()
        {
            List<ScmMethodProvider> methods = new List<ScmMethodProvider>();

            foreach (var serviceMethod in _inputClient.Methods)
            {
                var operation = serviceMethod.Operation;
                var method = BuildCreateRequestMethod(serviceMethod);
                methods.Add(method);
                MethodCache[operation] = method;

                // For paging operations with next link, also generate a CreateNextXXXRequest method
                if (serviceMethod is InputPagingServiceMethod { PagingMetadata.NextLink: not null })
                {
                    var nextMethod = BuildCreateRequestMethod(serviceMethod, isNextLinkRequest: true);
                    methods.Add(nextMethod);
                    NextMethodCache[operation] = nextMethod;
                }
            }

            return [.. methods];
        }

        private ScmMethodProvider BuildCreateRequestMethod(InputServiceMethod serviceMethod, bool isNextLinkRequest = false)
        {
            var pipelineField = ClientProvider.PipelineProperty.ToApi<ClientPipelineApi>();

            var options = ScmKnownParameters.RequestOptions;
            var parameters = GetMethodParameters(serviceMethod, MethodType.CreateRequest);
            if (isNextLinkRequest)
            {
                parameters = [ScmKnownParameters.NextPage, .. parameters];
            }
            var operation = serviceMethod.Operation;
            var methodName = isNextLinkRequest
                ? $"CreateNext{operation.Name.ToIdentifierName()}Request"
                : $"Create{operation.Name.ToIdentifierName()}Request";
            var signature = new MethodSignature(
                methodName,
                null,
                MethodSignatureModifiers.Internal,
                ScmCodeModelGenerator.Instance.TypeFactory.HttpMessageApi.HttpMessageType,
                null,
                [.. parameters, options]);
            var paramMap = new Dictionary<string, ParameterProvider>(signature.Parameters.ToDictionary(p => p.Name));

            foreach (var param in ClientProvider.ClientParameters)
            {
                paramMap[param.Name] = param;
            }

            var classifier = GetClassifier(operation);

            return new ScmMethodProvider(
                signature,
                new MethodBodyStatements(
                [
                    Declare("message", pipelineField.CreateMessage(options.ToApi<HttpRequestOptionsApi>(), classifier).ToApi<HttpMessageApi>(), out HttpMessageApi message),
                    message.ApplyResponseClassifier(classifier.ToApi<StatusCodeClassifierApi>()),
                    Declare("request", message.Request().ToApi<HttpRequestApi>(), out HttpRequestApi request),
                    request.SetMethod(operation.HttpMethod),
                    BuildRequest(serviceMethod, request, paramMap, signature, isNextLinkRequest: isNextLinkRequest),
                    message.ApplyRequestOptions(options.ToApi<HttpRequestOptionsApi>()),
                    Return(message)
                ]),
                this,
                xmlDocProvider: XmlDocProvider.Empty,
                serviceMethod: serviceMethod);
        }

        private MethodBodyStatement BuildRequest(
            InputServiceMethod serviceMethod,
            HttpRequestApi request,
            Dictionary<string, ParameterProvider> paramMap,
            MethodSignature signature,
            bool isNextLinkRequest = false)
        {
            InputPagingServiceMethod? pagingServiceMethod = serviceMethod as InputPagingServiceMethod;
            var operation = serviceMethod.Operation;
            var declareUri = Declare("uri", New.Instance(request.UriBuilderType), out ScopedApi uri);
            // For next request methods, handle URI differently
            var nextLink = isNextLinkRequest
                ? pagingServiceMethod?.PagingMetadata.NextLink
                : null;

            if (isNextLinkRequest && nextLink != null)
            {
                List<MethodBodyStatement> nextLinkBodyStatements =
                [
                    declareUri,
                    uri.Reset(ScmKnownParameters.NextPage.AsExpression()).Terminate()
                ];

                // handle reinjected parameters
                if (nextLink.ReInjectedParameters?.Count > 0)
                {
                    // map of the reinjected parameter name to its' corresponding parameter in the method signature
                    var reinjectedParamsMap = new Dictionary<string, ParameterProvider>(nextLink.ReInjectedParameters.Count);
                    foreach (var param in nextLink.ReInjectedParameters)
                    {
                        var reinjectedParameter = ScmCodeModelGenerator.Instance.TypeFactory.CreateParameter(param);
                        if (reinjectedParameter != null && paramMap.TryGetValue(reinjectedParameter.Name, out var paramInSignature))
                        {
                            reinjectedParamsMap[param.Name] = paramInSignature;
                        }
                    }

                    if (reinjectedParamsMap.Count > 0)
                    {
                        nextLinkBodyStatements.AddRange(AppendQueryParameters(uri, operation, reinjectedParamsMap));
                        nextLinkBodyStatements.Add(request.SetUri(uri));
                        nextLinkBodyStatements.AddRange(AppendHeaderParameters(request, operation, reinjectedParamsMap));
                        return nextLinkBodyStatements;
                    }
                }

                nextLinkBodyStatements.Add(request.SetUri(uri));
                nextLinkBodyStatements.AddRange(AppendHeaderParameters(request, operation, paramMap, isNextLink: true));
                return nextLinkBodyStatements;
            }

            return new MethodBodyStatements(
            [
                declareUri,
                uri.Reset(ClientProvider.EndpointField).Terminate(),
                .. AppendPathParameters(uri, operation, paramMap),
                .. AppendQueryParameters(uri, operation, paramMap),
                request.SetUri(uri),
                .. AppendHeaderParameters(request, operation, paramMap),
                .. GetSetContent(request, signature.Parameters)
            ]);
        }

        private IReadOnlyList<MethodBodyStatement> GetSetContent(HttpRequestApi request, IReadOnlyList<ParameterProvider> parameters)
        {
            var contentParam = parameters.FirstOrDefault(
                p => ReferenceEquals(p, ScmKnownParameters.RequestContent) || ReferenceEquals(p, ScmKnownParameters.OptionalRequestContent));
            return contentParam is null ? [] : [request.Content().Assign(contentParam).Terminate()];
        }

        private Dictionary<List<int>, PropertyProvider> BuildPipelineMessage20xClassifiers()
        {
            // Contains a mapping of classifier status codes to their corresponding pipeline message classifier property
            Dictionary<List<int>, PropertyProvider> classifiers = new(new StatusCodesComparer());

            foreach (var inputServiceMethod in _inputClient.Methods)
            {
                var inputOperation = inputServiceMethod.Operation;
                var statusCodes = GetSuccessStatusCodes(inputOperation);
                if (statusCodes.Count > 0 && !classifiers.ContainsKey(statusCodes))
                {
                    var classifierNameSuffix = string.Join(string.Empty, statusCodes);
                    var classifierBackingField = new FieldProvider(
                        FieldModifiers.Private | FieldModifiers.Static,
                        ScmCodeModelGenerator.Instance.TypeFactory.StatusCodeClassifierApi.ResponseClassifierType,
                        $"_pipelineMessageClassifier{classifierNameSuffix}",
                        this);

                    var classifierProperty = new PropertyProvider(
                        null,
                        MethodSignatureModifiers.Private | MethodSignatureModifiers.Static,
                        ScmCodeModelGenerator.Instance.TypeFactory.StatusCodeClassifierApi.ResponseClassifierType,
                        classifierBackingField.Name.Substring(1).ToIdentifierName(),
                        new ExpressionPropertyBody(
                            classifierBackingField.Assign(This.ToApi<StatusCodeClassifierApi>().Create(GetSuccessStatusCodes(inputOperation)))),
                        this)
                    {
                        BackingField = classifierBackingField
                    };

                    classifiers[statusCodes] = classifierProperty;
                }
            }

            return classifiers;
        }

        private PropertyProvider GetClassifier(InputOperation operation)
        {
            if (_pipelineMessage20xClassifiers.TryGetValue(GetSuccessStatusCodes(operation), out var classifier))
            {
                return classifier;
            }

            throw new InvalidOperationException($"Unexpected status codes for operation {operation.Name}");
        }

        private IEnumerable<MethodBodyStatement> AppendHeaderParameters(HttpRequestApi request, InputOperation operation, Dictionary<string, ParameterProvider> paramMap, bool isNextLink = false)
        {
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            foreach (var inputParameter in operation.Parameters)
            {
                if (inputParameter.Location != InputRequestLocation.Header)
                {
                    continue;
                }

                bool isAcceptParameter = inputParameter.IsAcceptHeader();
                if (isNextLink && !isAcceptParameter)
                {
                    continue;
                }

                CSharpType? type;
                string? format;
                ValueExpression? valueExpression;
                GetParamInfo(paramMap, operation, inputParameter, out type, out format, out valueExpression);
                if (valueExpression == null)
                {
                    continue;
                }

                // Check if parameter is already a string type or an enum with string values
                bool isStringType = type?.Equals(typeof(string)) == true ||
                    (isAcceptParameter && inputParameter.Type is InputEnumType { ValueType.Kind: InputPrimitiveTypeKind.String });
                ValueExpression toStringExpression = isStringType ?
                    valueExpression :
                    valueExpression.ConvertToString(Literal(format));
                MethodBodyStatement statement;

                if (type?.IsCollection == true)
                {
                    statement = request.SetHeaderDelimited(inputParameter.NameInRequest, valueExpression, Literal(inputParameter.ArraySerializationDelimiter), format != null ? Literal(format) : null);
                }
                else
                {
                    statement = request.SetHeaders([Literal(inputParameter.NameInRequest), toStringExpression.As<string>()]);
                }

                if (!TryGetSpecialHeaderParam(inputParameter, out _) && (!inputParameter.IsRequired || type?.IsNullable == true ||
                   (type is { IsValueType: false, IsFrameworkType: true } && type.FrameworkType != typeof(string))))
                {
                    statement = BuildQueryOrHeaderOrPathParameterNullCheck(type, valueExpression, statement);
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
                if (inputParameter.Location != InputRequestLocation.Query)
                    continue;

                string? format;
                ValueExpression? valueExpression;
                GetParamInfo(paramMap, operation, inputParameter, out var paramType, out format, out valueExpression);
                if (valueExpression == null)
                {
                    continue;
                }
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
                            statement = new ForEachStatement("param", valueExpression.AsDictionary(paramType),
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
                                new ForEachStatement("param", valueExpression.AsDictionary(paramType), out KeyValuePairExpression item)
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
                        statement = new ForEachStatement("param", valueExpression.As(paramType), out VariableExpression item)
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
                    statement = BuildQueryOrHeaderOrPathParameterNullCheck(paramType, valueExpression, statement);
                }

                statements.Add(statement);
            }

            return statements;
        }

        private static IfStatement BuildQueryOrHeaderOrPathParameterNullCheck(
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
                        ScmCodeModelGenerator.Instance.TypeFactory.DictionaryInitializationType.MakeGenericType(parameterType.Arguments),
                        out changeTrackingReference);
                }
                else
                {
                    changeTrackingCollectionDeclaration = Declare(
                        "changeTrackingList",
                        ScmCodeModelGenerator.Instance.TypeFactory.ListInitializationType.MakeGenericType(parameterType
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

        private IReadOnlyList<MethodBodyStatement> AppendPathParameters(ScopedApi uri, InputOperation operation, Dictionary<string, ParameterProvider> paramMap)
        {
            Dictionary<string, InputParameter> inputParamMap = new(operation.Parameters.ToDictionary(p => p.NameInRequest));
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);
            int uriOffset = GetUriOffset(operation.Uri);
            AddUriSegments(operation.Uri, uriOffset, uri, statements, inputParamMap, paramMap, operation);
            AddUriSegments(operation.Path, 0, uri, statements, inputParamMap, paramMap, operation);
            return statements;
        }

        private int GetUriOffset(string uriTemplate)
        {
            string? endpointParameter = ClientProvider.EndpointParameterName;
            if (endpointParameter == null)
            {
                return 0;
            }

            ReadOnlySpan<char> templateSpan = uriTemplate.AsSpan();
            ReadOnlySpan<char> parameterSpan = endpointParameter.AsSpan();

            if (templateSpan.StartsWith(parameterSpan, StringComparison.Ordinal))
            {
                return endpointParameter.Length;
            }

            const string httpPrefix = "http://";
            const string httpsPrefix = "https://";

            // Use span based comparison to avoid allocations
            if (templateSpan.StartsWith(httpsPrefix.AsSpan(), StringComparison.Ordinal) &&
                templateSpan[httpsPrefix.Length..].StartsWith(parameterSpan, StringComparison.Ordinal))
            {
                return httpsPrefix.Length + endpointParameter.Length;
            }

            if (templateSpan.StartsWith(httpPrefix.AsSpan(), StringComparison.Ordinal) &&
                templateSpan[httpPrefix.Length..].StartsWith(parameterSpan, StringComparison.Ordinal))
            {
                return httpPrefix.Length + endpointParameter.Length;
            }

            return 0;
        }

        private void AddUriSegments(
            string segments,
            int offset,
            ScopedApi uri,
            List<MethodBodyStatement> statements,
            Dictionary<string, InputParameter> inputParamMap,
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

                var path = pathSpan.Slice(0, paramIndex);
                statements.Add(uri.AppendPath(Literal(path.ToString()), false).Terminate());
                pathSpan = pathSpan.Slice(paramIndex + 1);
                var paramEndIndex = pathSpan.IndexOf('}');
                var paramName = pathSpan.Slice(0, paramEndIndex).ToString();
                /* when the parameter is in operation.uri, it is client parameter
                 * It is not operation parameter and not in inputParamHash list.
                 */
                var isClientParameter = ClientProvider.ClientParameters.Any(p => p.Name == paramName);
                CSharpType? type;
                string? format;
                ValueExpression? valueExpression;
                InputParameter? inputParam = null;
                if (isClientParameter)
                {
                    GetParamInfo(paramMap[paramName], out type, out format, out valueExpression);
                }
                else
                {
                    inputParam = inputParamMap[paramName];
                    if (inputParam.Location == InputRequestLocation.Path || inputParam.Location == InputRequestLocation.Uri)
                    {
                        GetParamInfo(paramMap, operation, inputParam, out type, out format, out valueExpression);
                        if (valueExpression == null)
                        {
                            break;
                        }
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
                    MethodBodyStatement statement;
                    if (inputParam?.IsRequired == false)
                    {
                        bool shouldPrependWithPathSeparator = path.Length > 0 && path[^1] != '/';
                        List<MethodBodyStatement> appendPathStatements = shouldPrependWithPathSeparator
                            ? [uri.AppendPath(Literal("/"), false).Terminate(), uri.AppendPath(valueExpression, escape).Terminate()]
                            : [uri.AppendPath(valueExpression, escape).Terminate()];
                        statement = BuildQueryOrHeaderOrPathParameterNullCheck(
                            type,
                            valueExpression,
                            appendPathStatements);
                    }
                    else
                    {
                        statement = uri.AppendPath(valueExpression, escape).Terminate();
                    }
                    statements.Add(statement);
                }

                pathSpan = pathSpan.Slice(paramEndIndex + 1);
            }
        }

        private static void GetParamInfo(Dictionary<string, ParameterProvider> paramMap, InputOperation operation, InputParameter inputParam, out CSharpType? type, out string? format, out ValueExpression? valueExpression)
        {
            type = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputParam.Type);
            if (inputParam.Kind == InputParameterKind.Constant && !(operation.IsMultipartFormData && inputParam.IsContentType))
            {
                valueExpression = Literal((inputParam.Type as InputLiteralType)?.Value);
                format = ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParam.Type).ToFormatSpecifier();
            }
            else if (TryGetAcceptHeaderWithMultipleContentTypes(inputParam, operation, out var contentTypes))
            {
                string joinedContentTypes = string.Join(", ", contentTypes);
                valueExpression = Literal(joinedContentTypes);
                format = ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParam.Type).ToFormatSpecifier();
            }
            else if (TryGetSpecialHeaderParam(inputParam, out var parameterProvider))
            {
                valueExpression = parameterProvider.DefaultValue!;
                format = ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParam.Type).ToFormatSpecifier();
            }
            else
            {
                if (paramMap.TryGetValue(inputParam.Name, out var paramProvider))
                {
                    GetParamInfo(paramProvider, out type, out format, out valueExpression);
                }
                else
                {
                    type = null;
                    format = null;
                    valueExpression = null;
                }
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

        private static bool TryGetSpecialHeaderParam(InputParameter inputParameter, [NotNullWhen(true)] out ParameterProvider? parameterProvider)
        {
            if (inputParameter.Location == InputRequestLocation.Header)
            {
                return _knownSpecialHeaderParams.TryGetValue(inputParameter.NameInRequest, out parameterProvider);
            }

            parameterProvider = null;
            return false;
        }

        private static List<int> GetSuccessStatusCodes(InputOperation operation)
        {
            HashSet<int> statusCodes = [];
            foreach (var response in operation.Responses)
            {
                if (response.IsErrorResponse)
                    continue;

                foreach (var statusCode in response.StatusCodes)
                {
                    if (statusCode >= 200 && statusCode < 300)
                    {
                        statusCodes.Add(statusCode);
                    }
                }
            }

            return [.. statusCodes.OrderBy(i => i)];
        }

        public MethodProvider GetCreateRequestMethod(InputOperation operation)
        {
            _ = Methods; // Ensure methods are built
            return MethodCache[operation];
        }

        public MethodProvider GetCreateNextLinkRequestMethod(InputOperation operation)
        {
            _ = Methods; // Ensure methods are built
            return NextMethodCache[operation];
        }

        internal static List<ParameterProvider> GetMethodParameters(InputServiceMethod serviceMethod, MethodType methodType)
        {
            SortedList<int, ParameterProvider> sortedParams = [];
            int path = 0;
            int required = 100;
            int bodyRequired = 200;
            int bodyOptional = 300;
            int optional = 400;

            var operation = serviceMethod.Operation;
            // For convenience methods, use the service method parameters
            var inputParameters = methodType is MethodType.Convenience ? serviceMethod.Parameters : operation.Parameters;

            ModelProvider? spreadSource = null;
            if (methodType == MethodType.Convenience)
            {
                InputParameter? inputOperationSpreadParameter = operation.Parameters.FirstOrDefault(p => p.Kind.HasFlag(InputParameterKind.Spread));
                spreadSource = inputOperationSpreadParameter != null
                    ? ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(GetSpreadParameterModel(inputOperationSpreadParameter))
                    : null;
            }

            foreach (InputParameter inputParam in inputParameters)
            {
                if (TryGetAcceptHeaderWithMultipleContentTypes(inputParam, serviceMethod.Operation, out _))
                {
                    continue;
                }

                if ((inputParam.Kind != InputParameterKind.Method &&
                     inputParam.Location != InputRequestLocation.Body) ||
                    TryGetSpecialHeaderParam(inputParam, out _))
                {
                    continue;
                }

                ParameterProvider? parameter = ScmCodeModelGenerator.Instance.TypeFactory.CreateParameter(inputParam)?.ToPublicInputParameter();
                if (parameter is null)
                {
                    continue;
                }

                if (methodType is MethodType.Protocol or MethodType.CreateRequest)
                {
                    if (inputParam.Location == InputRequestLocation.Body)
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
                else if (methodType is MethodType.Convenience && spreadSource != null && inputParam.Location.HasFlag(InputRequestLocation.Body))
                {
                    parameter.SpreadSource = spreadSource;
                }

                switch (parameter.Location)
                {
                    case ParameterLocation.Path:
                    case ParameterLocation.Uri:
                        sortedParams.Add(path++, parameter);
                        break;
                    case ParameterLocation.Query:
                    case ParameterLocation.Header:
                        if (parameter.DefaultValue == null)
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

            if (methodType == MethodType.CreateRequest)
            {
                // All the parameters should be required for the CreateRequest method
                foreach (var parameter in sortedParams.Values)
                {
                    parameter.DefaultValue = null;
                }
            }

            return [.. sortedParams.Values];
        }

        internal static InputModelType GetSpreadParameterModel(InputParameter inputParam)
        {
            if (inputParam.Type is InputModelType model)
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

        private class StatusCodesComparer : IEqualityComparer<List<int>>
        {
            bool IEqualityComparer<List<int>>.Equals(List<int>? x, List<int>? y)
            {
                return x != null && y != null && x.SequenceEqual(y);
            }

            int IEqualityComparer<List<int>>.GetHashCode(List<int> obj)
            {
                HashCode hash = new();
                foreach (var item in obj)
                {
                    hash.Add(item);
                }
                return hash.ToHashCode();
            }
        }

        private static bool TryGetAcceptHeaderWithMultipleContentTypes(
            InputParameter inputParameter,
            InputOperation inputOperation,
            [NotNullWhen(true)] out IReadOnlyList<string>? values)
        {
            values = null;
            if (!inputParameter.IsAcceptHeader())
            {
                return false;
            }

            if (inputParameter.Kind != InputParameterKind.Method)
            {
                return false;
            }

            // Check if the accept parameter has defined values
            var uniqueContentTypes = new HashSet<string>();
            if (inputParameter.Type is InputEnumType inputEnumType)
            {
                bool foundValues = false;
                foreach (var enumValue in inputEnumType.Values)
                {
                    if (enumValue.Value is string contentType)
                    {
                        uniqueContentTypes.Add(contentType);
                        foundValues = true;
                    }
                }
                if (foundValues)
                {
                    values = [.. uniqueContentTypes.OrderBy(contentType => contentType)];
                    return true;
                }
            }

            // Otherwise, get the content types across all responses
            foreach (var response in inputOperation.Responses)
            {
                foreach (var contentType in response.ContentTypes)
                {
                    uniqueContentTypes.Add(contentType);
                }
            }

            if (uniqueContentTypes.Count <= 1)
            {
                return false;
            }

            values = [.. uniqueContentTypes.OrderBy(contentType => contentType)];

            return true;
        }
    }
}

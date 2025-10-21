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

            // Build message and all request modifications
            var messageStatements = BuildMessage(serviceMethod, signature, isNextLinkRequest);

            return new ScmMethodProvider(
                signature,
                messageStatements,
                this,
                xmlDocProvider: XmlDocProvider.Empty,
                serviceMethod: serviceMethod);
        }

        private MethodBodyStatements BuildMessage(
            InputServiceMethod serviceMethod,
            MethodSignature signature,
            bool isNextLinkRequest = false)
        {
            // Create required components
            var pipelineField = ClientProvider.PipelineProperty.ToApi<ClientPipelineApi>();
            var options = ScmKnownParameters.RequestOptions;
            var operation = serviceMethod.Operation;
            var classifier = GetClassifier(operation);

            var paramMap = new Dictionary<string, ParameterProvider>(signature.Parameters.ToDictionary(p => p.Name));
            foreach (var param in ClientProvider.ClientParameters)
            {
                paramMap[param.Name] = param;
            }

            InputPagingServiceMethod? pagingServiceMethod = serviceMethod as InputPagingServiceMethod;
            var uriBuilderType =
                ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestApi.ToExpression().UriBuilderType;
            var declareUri = Declare("uri", New.Instance(uriBuilderType), out ScopedApi uri);

            // For next request methods, handle URI differently
            var nextLink = isNextLinkRequest
                ? pagingServiceMethod?.PagingMetadata.NextLink
                : null;

            var statements = new List<MethodBodyStatement>();

            if (isNextLinkRequest && nextLink != null)
            {
                statements.AddRange([
                    declareUri,
                    uri.Reset(ScmKnownParameters.NextPage.AsVariable()).Terminate()
                ]);

                // handle reinjected parameters for URI
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
                        statements.AddRange(AppendQueryParameters(uri, operation, reinjectedParamsMap));
                    }
                }
            }
            else
            {
                statements.AddRange([
                    declareUri,
                    uri.Reset(ClientProvider.EndpointField).Terminate()
                ]);
                statements.AddRange(AppendPathParameters(uri, operation, paramMap));
                statements.AddRange(AppendQueryParameters(uri, operation, paramMap));
            }

            // Create the message
            statements.AddRange([.. pipelineField.CreateMessage(options.ToApi<HttpRequestOptionsApi>(), uri, Literal(operation.HttpMethod), classifier, out HttpMessageApi message, out HttpRequestApi request)]);

            // Handle request modifications
            if (isNextLinkRequest && nextLink != null)
            {
                // handle reinjected parameters for headers
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
                        statements.AddRange(AppendHeaderParameters(request, operation, reinjectedParamsMap));
                    }
                    else
                    {
                        statements.AddRange(AppendHeaderParameters(request, operation, paramMap, isNextLink: true));
                    }
                }
                else
                {
                    statements.AddRange(AppendHeaderParameters(request, operation, paramMap, isNextLink: true));
                }
            }
            else
            {
                statements.AddRange(AppendHeaderParameters(request, operation, paramMap));
                statements.AddRange(GetSetContent(request, signature.Parameters));
            }

            // Apply request options and return message
            statements.AddRange([
                message.ApplyRequestOptions(options.ToApi<HttpRequestOptionsApi>()),
                Return(message)
            ]);

            return new MethodBodyStatements(statements);
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
                if (inputParameter is not InputHeaderParameter inputHeaderParameter)
                {
                    continue;
                }

                bool isAcceptParameter = inputHeaderParameter.IsAcceptHeader();
                if (isNextLink && !isAcceptParameter)
                {
                    continue;
                }

                CSharpType? type;
                SerializationFormat? serializationFormat;
                ValueExpression? valueExpression;
                GetParamInfo(paramMap, operation, inputHeaderParameter, out type, out serializationFormat, out valueExpression);
                if (valueExpression == null)
                {
                    continue;
                }

                // Check if parameter is already a string type or an enum with string values
                bool isStringType = type?.Equals(typeof(string)) == true ||
                    (isAcceptParameter && inputHeaderParameter.Type is InputEnumType { ValueType.Kind: InputPrimitiveTypeKind.String });
                ValueExpression toStringExpression = isStringType ?
                    valueExpression :
                    GetParameterValueExpression(valueExpression, serializationFormat);
                MethodBodyStatement statement;

                if (type?.IsCollection == true)
                {
                    statement = request.SetHeaderDelimited(inputHeaderParameter.SerializedName, valueExpression, Literal(inputHeaderParameter.ArraySerializationDelimiter), GetFormatEnumValue(serializationFormat));
                }
                else
                {
                    statement = request.SetHeaders([Literal(inputHeaderParameter.SerializedName), toStringExpression.As<string>()]);
                }

                if (!TryGetSpecialHeaderParam(inputHeaderParameter, out _) && (!inputHeaderParameter.IsRequired || type?.IsNullable == true ||
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
                if (inputParameter is not InputQueryParameter inputQueryParameter)
                    continue;

                var queryStatement = BuildQueryParameterStatement(uri, inputQueryParameter, paramMap, operation);
                if (queryStatement != null)
                {
                    statements.Add(queryStatement);
                }
            }

            return statements;
        }

        private static MethodBodyStatement? BuildQueryParameterStatement(
            ScopedApi uri,
            InputQueryParameter inputQueryParameter,
            Dictionary<string, ParameterProvider> paramMap,
            InputOperation operation)
        {
            GetParamInfo(paramMap, operation, inputQueryParameter, out var paramType, out var serializationFormat, out var valueExpression);
            if (valueExpression == null)
            {
                return null;
            }

            var statement = BuildAppendQueryStatement(uri, inputQueryParameter, paramType, valueExpression, serializationFormat);

            // Apply null check if needed
            if (!inputQueryParameter.IsRequired || paramType?.IsNullable == true ||
                (paramType is { IsValueType: false, IsFrameworkType: true } && paramType.FrameworkType != typeof(string)))
            {
                statement = BuildQueryOrHeaderOrPathParameterNullCheck(paramType, valueExpression, statement);
            }

            return statement;
        }

        private static MethodBodyStatement BuildAppendQueryStatement(
            ScopedApi uri,
            InputQueryParameter inputQueryParameter,
            CSharpType? paramType,
            ValueExpression valueExpression,
            SerializationFormat? serializationFormat)
        {
            // Handle non-collection parameters
            if (paramType?.IsCollection != true)
            {
                var toStringExpression = paramType?.Equals(typeof(string)) == true
                    ? valueExpression
                    : GetParameterValueExpression(valueExpression, serializationFormat);

                return uri.AppendQuery(Literal(inputQueryParameter.SerializedName), toStringExpression, true).Terminate();
            }

            var delimiter = inputQueryParameter.ArraySerializationDelimiter;
            if (inputQueryParameter.Type is InputDictionaryType)
            {
                if (inputQueryParameter.Explode)
                {
                    var forEachStatement = new ForEachStatement(
                        "param",
                        valueExpression.AsDictionary(paramType),
                        out KeyValuePairExpression item);
                    var convertedItem = paramType.ElementType.IsEnum
                        ? paramType.ElementType.ToSerial(item)
                        : item.Value;
                    forEachStatement.Add(uri.AppendQuery(item.Key, convertedItem, true).Terminate());
                    return forEachStatement;
                }
                else
                {
                    return new MethodBodyStatement[]
                    {
                        Declare("list", New.List<object>(), out var list),
                        new ForEachStatement("param", valueExpression.AsDictionary(paramType), out KeyValuePairExpression item)
                        {
                            list.Add(item.Key),
                            list.Add(item.Value)
                        },
                        uri.AppendQueryDelimited(Literal(inputQueryParameter.SerializedName), list, GetFormatEnumValue(serializationFormat), true).Terminate()
                    };
                }
            }

            // Array handling
            if (!inputQueryParameter.Explode)
            {
                return uri.AppendQueryDelimited(Literal(inputQueryParameter.SerializedName), valueExpression, GetFormatEnumValue(serializationFormat), true, delimiter: delimiter).Terminate();
            }
            else
            {
                var forEachStatement = new ForEachStatement("param", valueExpression.As(paramType), out VariableExpression item);
                ValueExpression convertedItem;
                if (paramType.ElementType.IsEnum)
                {
                    convertedItem = paramType.ElementType.ToSerial(item);
                }
                else
                {
                    convertedItem = item;
                }
                forEachStatement.Add(uri.AppendQuery(Literal(inputQueryParameter.SerializedName), convertedItem, true).Terminate());
                return forEachStatement;
            }
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
            Dictionary<string, InputParameter> inputParamMap = new(operation.Parameters.ToDictionary(p => p.SerializedName));
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
                SerializationFormat? serializationFormat;
                ValueExpression? valueExpression;
                InputParameter? inputParam = null;
                if (isClientParameter)
                {
                    GetParamInfo(paramMap[paramName], out type, out serializationFormat, out valueExpression);
                }
                else
                {
                    if (isClientParameter)
                    {
                        GetParamInfo(paramMap[paramName], out type, out serializationFormat, out valueExpression);
                    }
                    else
                    {
                        inputParam = inputParamMap[paramName];
                        if (inputParam is InputPathParameter || inputParam is InputEndpointParameter)
                        {
                            GetParamInfo(paramMap, operation, inputParam, out type, out serializationFormat, out valueExpression);
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
                }
                string? format = serializationFormat?.ToFormatSpecifier();
                ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                InputPathParameter? inputPathParameter = inputParam as InputPathParameter;
                bool escape = !inputPathParameter?.SkipUrlEncoding ?? true;
                if (type?.OutputType.IsCollection == true)
                {
                    statements.Add(uri.AppendPathDelimited(valueExpression, GetFormatEnumValue(serializationFormat), escape).Terminate());
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

        private static void GetParamInfo(Dictionary<string, ParameterProvider> paramMap, InputOperation operation, InputParameter inputParam, out CSharpType? type, out SerializationFormat? serializationFormat, out ValueExpression? valueExpression)
        {
            type = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputParam.Type);
            serializationFormat = null;
            if (inputParam.Scope == InputParameterScope.Constant && !(operation.IsMultipartFormData && inputParam is InputHeaderParameter headerParameter && headerParameter.IsContentType))
            {
                valueExpression = Literal((inputParam.Type as InputLiteralType)?.Value);
                serializationFormat = ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParam.Type);
            }
            else if (TryGetAcceptHeaderWithMultipleContentTypes(inputParam, operation, out var contentTypes))
            {
                string joinedContentTypes = string.Join(", ", contentTypes);
                valueExpression = Literal(joinedContentTypes);
                serializationFormat = ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParam.Type);
            }
            else if (TryGetSpecialHeaderParam(inputParam, out var parameterProvider))
            {
                valueExpression = parameterProvider.DefaultValue!;
                serializationFormat = ScmCodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(inputParam.Type);
            }
            else
            {
                if (paramMap.TryGetValue(inputParam.Name, out var paramProvider))
                {
                    GetParamInfo(paramProvider, out type, out serializationFormat, out valueExpression);
                }
                else
                {
                    type = null;
                    valueExpression = null;
                }
            }
        }

        private static void GetParamInfo(ParameterProvider paramProvider, out CSharpType? type, out SerializationFormat? serializationFormat, out ValueExpression valueExpression)
        {
            type = paramProvider.Field is null ? paramProvider.Type : paramProvider.Field.Type;
            if (type.IsEnum)
            {
                valueExpression = type.ToSerial(paramProvider);
                serializationFormat = SerializationFormat.Default;
            }
            else
            {
                valueExpression = paramProvider.Field is null ? paramProvider : paramProvider.Field;
                serializationFormat = paramProvider.WireInfo.SerializationFormat;
            }
        }

        private static ValueExpression GetParameterValueExpression(ValueExpression valueExpression, SerializationFormat? serializationFormat)
        {
            return valueExpression.ConvertToString(GetFormatEnumValue(serializationFormat));
        }

        private static ValueExpression? GetFormatEnumValue(SerializationFormat? serializationFormat)
        {
            var serializationFormatType = new CSharpType(typeof(SerializationFormatDefinition));

            if (!serializationFormat.HasValue)
            {
                return null;
            }

            // For default, just return null to simplify the generated code as the parameter is optional
            // with a default value of Default
            if (serializationFormat == SerializationFormat.Default)
            {
                return null;
            }

            var memberName = serializationFormat.Value.ToString();
            return new MemberExpression(serializationFormatType, memberName);
        }

        private static bool TryGetSpecialHeaderParam(InputParameter inputParameter, [NotNullWhen(true)] out ParameterProvider? parameterProvider)
        {
            if (inputParameter is InputHeaderParameter ||
                inputParameter is InputMethodParameter inputMethodParameter && inputMethodParameter.Location == InputRequestLocation.Header)
            {
                return _knownSpecialHeaderParams.TryGetValue(inputParameter.SerializedName, out parameterProvider);
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
                InputParameter? inputOperationSpreadParameter = operation.Parameters.FirstOrDefault(p => p.Scope.HasFlag(InputParameterScope.Spread));
                spreadSource = inputOperationSpreadParameter != null
                    ? ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(GetSpreadParameterModel(inputOperationSpreadParameter))
                    : null;
            }

            foreach (InputParameter inputParam in inputParameters)
            {
                if (inputParam.IsReadOnly)
                {
                    continue;
                }

                if (TryGetAcceptHeaderWithMultipleContentTypes(inputParam, serviceMethod.Operation, out _))
                {
                    continue;
                }

                if (TryGetSpecialHeaderParam(inputParam, out _))
                {
                    continue;
                }

                if (inputParam.Scope != InputParameterScope.Method)
                {
                    if (inputParam is not InputBodyParameter &&
                        !(inputParam is InputMethodParameter { Location: InputRequestLocation.Body }))
                    {
                        continue;
                    }
                }

                if (inputParam is { IsRequired: true, Type: InputLiteralType or InputEnumTypeValue })
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
                    if (inputParam is InputBodyParameter)
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
                else if (methodType is MethodType.Convenience &&
                    spreadSource != null
                    && inputParam is InputMethodParameter inputMethodParameter
                    && inputMethodParameter.Location == InputRequestLocation.Body)
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

            if (inputParameter.Scope != InputParameterScope.Method)
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

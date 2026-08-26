// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Primitives;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Input.Extensions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using Microsoft.TypeSpec.Generator.Utilities;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public class RestClientProvider : TypeProvider
    {
        private const string RepeatabilityRequestIdHeader = "Repeatability-Request-ID";
        private const string RepeatabilityFirstSentHeader = "Repeatability-First-Sent";
        private const string TopParameterName = "top";
        private const string MaxCountParameterName = "maxCount";
        private const string MaxPageSizeParameterName = "maxPageSize";
        private const string ContentParameterName = "content";

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

        public ClientProvider ClientProvider { get; }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{Name}.RestClient.cs");

        protected override string BuildName() => ClientProvider.Name;

        protected override string BuildNamespace() => ClientProvider.Type.Namespace;

        protected override IReadOnlyList<MethodProvider> BuildMethodsForBackCompatibility(IEnumerable<MethodProvider> originalMethods)
            => [.. originalMethods];

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

        protected override IReadOnlyList<CSharpType> BuildHelperDependencyTypes()
        {
            var requestApi = ScmCodeModelGenerator.Instance.TypeFactory.HttpRequestApi.ToExpression();
            var uriBuilderType = requestApi.UriBuilderType;
            var dependencies = new List<CSharpType>();
            var dependencyNames = new HashSet<string>(StringComparer.Ordinal);
            if (uriBuilderType == typeof(ClientUriBuilderDefinition))
            {
                TryAddDependency(dependencies, dependencyNames, new ClientUriBuilderDefinition().Type);
            }

            foreach (var serviceMethod in _inputClient.Methods)
            {
                foreach (var parameter in serviceMethod.Operation.Parameters)
                {
                    if (IsContentTypeParameter(parameter) ||
                        parameter is not InputHeaderParameter and not InputQueryParameter)
                    {
                        continue;
                    }

                    var type = ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(parameter.Type);
                    if (type?.IsDictionary == true)
                    {
                        TryAddDependency(dependencies, dependencyNames, ScmCodeModelGenerator.Instance.TypeFactory.DictionaryInitializationType);
                        if (parameter is InputHeaderParameter headerParameter &&
                            !string.IsNullOrEmpty(headerParameter.CollectionHeaderPrefix) &&
                            requestApi.GetCollectionHeaderHelperType() is { } collectionHeaderHelperType)
                        {
                            TryAddDependency(dependencies, dependencyNames, collectionHeaderHelperType);
                        }
                    }
                    else if (type?.IsCollection == true)
                    {
                        TryAddDependency(dependencies, dependencyNames, ScmCodeModelGenerator.Instance.TypeFactory.ListInitializationType);
                    }
                }
            }

            return dependencies;
        }

        protected override IReadOnlyList<CSharpType> BuildBodyDependencyTypes()
        {
            var dependencies = new List<CSharpType>();
            var dependencyNames = new HashSet<string>(StringComparer.Ordinal);
            TryAddDependency(dependencies, dependencyNames, ScmCodeModelGenerator.Instance.TypeFormattersDefinition.Type);
            return dependencies;
        }

        private static void TryAddDependency(List<CSharpType> dependencies, HashSet<string> dependencyNames, CSharpType dependency)
        {
            if (dependencyNames.Add(dependency.FullyQualifiedName))
            {
                dependencies.Add(dependency);
            }
        }

        protected override ScmMethodProvider[] BuildMethods()
        {
            List<ScmMethodProvider> methods = new List<ScmMethodProvider>();

            foreach (var serviceMethod in _inputClient.Methods)
            {
                var operation = serviceMethod.Operation;
                var method = BuildCreateRequestMethod(serviceMethod);
                method = VisitCreateRequestMethod(method, serviceMethod);

                if (method != null)
                {
                    methods.Add(method);
                    MethodCache[operation] = method;
                }

                // For paging operations with next link, also generate a CreateNextXXXRequest method
                if (serviceMethod is InputPagingServiceMethod { PagingMetadata.NextLink: not null })
                {
                    var nextMethod = BuildCreateRequestMethod(serviceMethod, isNextLinkRequest: true);
                    nextMethod = VisitCreateRequestMethod(nextMethod, serviceMethod);

                    if (nextMethod != null)
                    {
                        methods.Add(nextMethod);
                        NextMethodCache[operation] = nextMethod;
                    }
                }
            }

            return [.. methods];
        }

        private ScmMethodProvider? VisitCreateRequestMethod(ScmMethodProvider method, InputServiceMethod serviceMethod)
        {
            ScmMethodProvider? result = method;
            foreach (var visitor in ScmCodeModelGenerator.Instance.Visitors)
            {
                if (visitor is ScmLibraryVisitor scmVisitor)
                {
                    result = scmVisitor.VisitCreateRequestMethod(serviceMethod, this, result);
                }
            }

            return method;
        }

        private ScmMethodProvider BuildCreateRequestMethod(InputServiceMethod serviceMethod, bool isNextLinkRequest = false)
        {
            var options = ScmKnownParameters.RequestOptions;
            var parameters = GetMethodParameters(serviceMethod, ScmMethodKind.CreateRequest, ClientProvider);

            if (isNextLinkRequest)
            {
                // For next link requests, filter parameters to only include reinjected ones
                var pagingServiceMethod = serviceMethod as InputPagingServiceMethod;
                var nextLink = pagingServiceMethod?.PagingMetadata.NextLink;
                var reinjectedParamNames = new HashSet<string>(StringComparer.Ordinal);

                // Add parameters from nextLink.ReInjectedParameters
                if (nextLink?.ReInjectedParameters != null)
                {
                    foreach (var param in nextLink.ReInjectedParameters)
                    {
                        reinjectedParamNames.Add(param.Name);
                    }
                }

                var pageSizeParameterName = GetPageSizeParameterName(pagingServiceMethod);

                // Only filter if there are reinjected parameters specified
                if (reinjectedParamNames.Count > 0 || pageSizeParameterName != null)
                {
                    parameters = parameters
                        .Where(p =>
                        {
                            var name = p.InputParameter?.Name ?? p.Name;
                            // Reinjected names must match exactly so that parameters differing only by casing are
                            // not conflated. The page size name is matched case-insensitively because the operation
                            // and method parameters intentionally differ in casing.
                            return reinjectedParamNames.Contains(name) ||
                                (pageSizeParameterName != null &&
                                    name.Equals(pageSizeParameterName, StringComparison.OrdinalIgnoreCase));
                        })
                        .ToList();
                }

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
                ScmMethodKind.CreateRequest,
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

            var parameters = signature.Parameters.Concat(ClientProvider.ClientParameters).ToArray();
            var paramMap = new ParameterProviderMap();

            // Register the input model names first so that they win over the normalized C# names, which may collide
            // with the raw name of a different parameter.
            foreach (var parameter in parameters)
            {
                if (parameter.InputParameter is not { } inputParameter)
                {
                    continue;
                }

                paramMap.AddInputName(inputParameter.Name, parameter);
                paramMap.AddInputName(inputParameter.OriginalName, parameter);
                if (inputParameter is InputMethodParameter { ParamAlias: string alias })
                {
                    paramMap.AddInputName(alias, parameter);
                }
            }

            // The generated names act as fallback aliases for lookups without a matching input parameter.
            foreach (var parameter in parameters)
            {
                paramMap.SetGeneratedName(parameter.Name, parameter);
            }

            foreach (var inputParameter in _inputClient.Parameters)
            {
                if (inputParameter is InputMethodParameter { ParamAlias: string alias } &&
                    paramMap.TryGetValue(inputParameter.Name, out var parameter))
                {
                    paramMap.SetInputName(alias, parameter);
                }
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
                var nextPageVar = ScmKnownParameters.NextPage.AsVariable();
                statements.Add(declareUri);
                statements.Add(new IfElseStatement(
                    new IfStatement(nextPageVar.Property(nameof(Uri.IsAbsoluteUri)))
                    {
                        uri.Reset(nextPageVar).Terminate()
                    },
                    uri.Reset(New.Instance<Uri>(ClientProvider.EndpointField, nextPageVar)).Terminate()));

                // handle reinjected parameters for URI
                var reinjectedParamsMap = GetReinjectedParametersMap(nextLink, pagingServiceMethod, operation, paramMap);

                if (reinjectedParamsMap.Count > 0)
                {
                    statements.AddRange(AppendQueryParameters(uri, operation, reinjectedParamsMap, isNextLinkRequest: true));
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
                var reinjectedHeaderParamsMap = GetReinjectedParametersMap(nextLink, pagingServiceMethod, operation, paramMap);

                if (reinjectedHeaderParamsMap.Count > 0)
                {
                    statements.AddRange(AppendHeaderParameters(request, operation, reinjectedHeaderParamsMap));
                }
                else
                {
                    statements.AddRange(AppendHeaderParameters(request, operation, paramMap, isNextLink: true));
                }
            }
            else
            {
                var contentParam = GetBodyContentParameter(signature.Parameters);
                statements.AddRange(AppendHeaderParameters(request, operation, paramMap, contentParam: contentParam));
                statements.AddRange(GetSetContent(request, signature.Parameters));
            }

            // Apply request options and return message
            statements.AddRange([
                message.ApplyRequestOptions(options.ToApi<HttpRequestOptionsApi>()),
                Return(message)
            ]);

            return new MethodBodyStatements(statements);
        }

        private ParameterProviderMap GetReinjectedParametersMap(
            InputNextLink nextLink,
            InputPagingServiceMethod? pagingServiceMethod,
            InputOperation operation,
            ParameterProviderMap paramMap)
        {
            var reinjectedParamsMap = new ParameterProviderMap(allowCaseInsensitiveFallback: false);

            // Add parameters from nextLink.ReInjectedParameters
            if (nextLink.ReInjectedParameters?.Count > 0)
            {
                foreach (var param in nextLink.ReInjectedParameters)
                {
                    if (paramMap.TryGetValue(param.Name, out var paramInSignature))
                    {
                        reinjectedParamsMap[param.Name] = paramInSignature;
                    }
                }
            }

            // Add maxPageSize parameter if PageSizeParameterSegments is specified
            var pageSizeParameterName = GetPageSizeParameterName(pagingServiceMethod);
            if (pageSizeParameterName != null)
            {
                // Find the parameter in the operation parameters
                var pageSizeParameter = operation.Parameters.FirstOrDefault(p => p.Name.Equals(pageSizeParameterName, StringComparison.OrdinalIgnoreCase));
                if (pageSizeParameter != null)
                {
                    if (paramMap.TryGetValue(pageSizeParameter.Name, out var paramInSignature))
                    {
                        reinjectedParamsMap[pageSizeParameter.Name] = paramInSignature;
                    }
                }
            }

            // Add API version parameters that need to be preserved across pagination requests
            var apiVersionParam = operation.Parameters.FirstOrDefault(p => p.IsApiVersion);
            if (apiVersionParam != null && !reinjectedParamsMap.ContainsExactInputName(apiVersionParam.Name))
            {
                if (paramMap.TryGetValue(apiVersionParam.Name, out var paramInSignature))
                {
                    reinjectedParamsMap[apiVersionParam.Name] = paramInSignature;
                }
            }

            return reinjectedParamsMap;
        }

        private IReadOnlyList<MethodBodyStatement> GetSetContent(HttpRequestApi request, IReadOnlyList<ParameterProvider> parameters)
        {
            var contentParam = GetBodyContentParameter(parameters);
            return contentParam is null ? [] : [request.Content().Assign(contentParam).Terminate()];
        }

        private static ParameterProvider? GetBodyContentParameter(IReadOnlyList<ParameterProvider> parameters)
            => parameters.FirstOrDefault(static p => p.InputParameter is InputBodyParameter) ??
                parameters.FirstOrDefault(static p => p.Location == ParameterLocation.Body);

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
                            classifierBackingField.Assign(This.ToApi<StatusCodeClassifierApi>().Create(GetSuccessStatusCodes(inputOperation)), nullCoalesce: true)),
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

        private IEnumerable<MethodBodyStatement> AppendHeaderParameters(HttpRequestApi request, InputOperation operation, ParameterProviderMap paramMap, bool isNextLink = false, ParameterProvider? contentParam = null)
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
                    if (!string.IsNullOrEmpty(inputHeaderParameter.CollectionHeaderPrefix) && type.IsDictionary)
                    {
                        statement = request.AddCollectionHeaders(Literal(inputHeaderParameter.CollectionHeaderPrefix), valueExpression);
                    }
                    else
                    {
                        statement = request.SetHeaderDelimited(inputHeaderParameter.SerializedName, valueExpression, Literal(inputHeaderParameter.ArraySerializationDelimiter), GetFormatEnumValue(serializationFormat));
                    }
                }
                else
                {
                    statement = request.SetHeaders([Literal(inputHeaderParameter.SerializedName), toStringExpression.As<string>()]);
                }

                // If this is a Content-Type header and there's an optional content parameter, wrap in content null check
                if (inputHeaderParameter.IsContentType && contentParam != null &&
                    operation.Parameters.Any(p => p is InputBodyParameter bodyParam && !bodyParam.IsRequired))
                {
                    statement = new IfStatement(contentParam.NotEqual(Null)) { statement };
                }
                else if (!TryGetSpecialHeaderParam(inputHeaderParameter, out _) && (!inputHeaderParameter.IsRequired || type?.IsNullable == true ||
                   (type is { IsValueType: false, IsFrameworkType: true } && type.FrameworkType != typeof(string))))
                {
                    statement = BuildQueryOrHeaderOrPathParameterNullCheck(type, valueExpression, statement);
                }

                statements.Add(statement);
            }

            return statements;
        }

        private List<MethodBodyStatement> AppendQueryParameters(ScopedApi uri, InputOperation operation, ParameterProviderMap paramMap, bool isNextLinkRequest = false)
        {
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            foreach (var inputParameter in operation.Parameters)
            {
                if (inputParameter is not InputQueryParameter inputQueryParameter)
                {
                    continue;
                }

                var queryStatement = BuildQueryParameterStatement(uri, inputQueryParameter, paramMap, operation, isNextLinkRequest);
                if (queryStatement != null)
                {
                    statements.Add(queryStatement);
                }
            }

            return statements;
        }

        private MethodBodyStatement? BuildQueryParameterStatement(
            ScopedApi uri,
            InputQueryParameter inputQueryParameter,
            ParameterProviderMap paramMap,
            InputOperation operation,
            bool isNextLinkRequest = false)
        {
            GetParamInfo(paramMap, operation, inputQueryParameter, out var paramType, out var serializationFormat, out var valueExpression);
            if (valueExpression == null)
            {
                return null;
            }

            // Determine if we should update existing parameters or always append
            InputPagingServiceMethod? pagingServiceMethod = _inputClient.Methods.OfType<InputPagingServiceMethod>()
                .FirstOrDefault(m => m.Operation == operation);
            bool shouldUpdateExisting = isNextLinkRequest &&
                                      ShouldUpdateReinjectedParameter(inputQueryParameter, pagingServiceMethod) &&
                                      paramType?.IsCollection != true;

            MethodBodyStatement statement = shouldUpdateExisting
                ? BuildUpdateQueryStatement(uri, inputQueryParameter, paramType, valueExpression, serializationFormat)
                : BuildAppendQueryStatement(uri, inputQueryParameter, paramType, valueExpression, serializationFormat);

            // Apply null check if needed
            if (!inputQueryParameter.IsRequired || paramType?.IsNullable == true ||
                (paramType is { IsValueType: false, IsFrameworkType: true } && paramType.FrameworkType != typeof(string)))
            {
                statement = BuildQueryOrHeaderOrPathParameterNullCheck(paramType, valueExpression, statement);
            }

            return statement;
        }

        private static ValueExpression GetQueryParameterStringExpression(
            CSharpType? paramType,
            ValueExpression valueExpression,
            SerializationFormat? serializationFormat)
        {
            return paramType?.Equals(typeof(string)) == true
                ? valueExpression
                : GetParameterValueExpression(valueExpression, serializationFormat);
        }

        private static MethodBodyStatement BuildUpdateQueryStatement(
            ScopedApi uri,
            InputQueryParameter inputQueryParameter,
            CSharpType? paramType,
            ValueExpression valueExpression,
            SerializationFormat? serializationFormat)
        {
            var toStringExpression = GetQueryParameterStringExpression(paramType, valueExpression, serializationFormat);
            var parameterName = inputQueryParameter.SerializedName;

            return uri.UpdateQuery(Literal(parameterName), toStringExpression).Terminate();
        }

        private static MethodBodyStatement BuildAppendQueryStatement(
            ScopedApi uri,
            InputQueryParameter inputQueryParameter,
            CSharpType? paramType,
            ValueExpression valueExpression,
            SerializationFormat? serializationFormat)
        {
            if (paramType?.IsCollection != true)
            {
                // A model-typed query parameter marked with `explode` must be expanded into one query
                // entry per property (RFC 6570 form explode, e.g. `?field=status&value=active`) rather
                // than serialized via the object's ToString (which previously produced the type name).
                if (inputQueryParameter.Explode && inputQueryParameter.Type is InputModelType inputModel)
                {
                    var explodeStatement = BuildExplodeModelQueryStatement(uri, inputModel, valueExpression);
                    if (explodeStatement != null)
                    {
                        return explodeStatement;
                    }
                }

                var toStringExpression = GetQueryParameterStringExpression(paramType, valueExpression, serializationFormat);
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
                        ? paramType.ElementType.ToSerial(item.Value)
                        : item.Value;
                    AddExplodeQueryItem(forEachStatement, uri, item.Key, convertedItem, paramType.ElementType);
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
                AddExplodeQueryItem(forEachStatement, uri, Literal(inputQueryParameter.SerializedName), convertedItem, paramType.ElementType);
                return forEachStatement;
            }
        }

        private static bool IsExtensibleStringEnum(CSharpType type)
            => type.IsEnum && type.IsStruct && type.UnderlyingEnumType == typeof(string);

        private static void AddExplodeQueryItem(
            ForEachStatement forEachStatement,
            ScopedApi uri,
            ValueExpression key,
            ValueExpression convertedItem,
            CSharpType elementType)
        {
            if (IsExtensibleStringEnum(elementType))
            {
                forEachStatement.Add(Declare("paramStr", typeof(string), convertedItem, out VariableExpression cachedVar));
                forEachStatement.Add(new IfStatement(cachedVar.As<string>().NotEqual(Null))
                {
                    uri.AppendQuery(key, cachedVar, true).Terminate()
                });
            }
            else
            {
                forEachStatement.Add(uri.AppendQuery(key, convertedItem, true).Terminate());
            }
        }

        /// <summary>
        /// Builds the statements for a model-typed query parameter that uses form-style `explode`.
        /// Each (simple) property of the model is emitted as its own query entry using the property's
        /// wire name (RFC 6570 form explode, e.g. <c>?field=status&amp;value=active</c>).
        /// Returns <c>null</c> when the model contains a property that is not a simple scalar/enum
        /// (e.g. a nested object or a collection), in which case the caller falls back to the default
        /// handling. Nested/complex expansion is tracked separately (see issue #11123).
        /// </summary>
        private static MethodBodyStatement? BuildExplodeModelQueryStatement(
            ScopedApi uri,
            InputModelType inputModel,
            ValueExpression valueExpression)
        {
            var modelProvider = ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel);
            if (modelProvider is null)
            {
                return null;
            }

            var properties = modelProvider.CanonicalView.Properties;
            if (properties.Count == 0)
            {
                return null;
            }

            // Only expand when every property is a simple scalar or enum. Nested objects and
            // collections are not defined by RFC 6570 form explode and require a separate design
            // decision, so we fall back to the default handling for those.
            foreach (var property in properties)
            {
                if (property.WireInfo is null ||
                    property.Type.IsCollection ||
                    (!property.Type.IsFrameworkType && !property.Type.IsEnum))
                {
                    return null;
                }
            }

            var statements = new List<MethodBodyStatement>();
            foreach (var property in properties)
            {
                var propertyAccess = valueExpression.Property(property.Name);
                var propertyType = property.Type;

                ValueExpression convertedValue = propertyType.IsEnum
                    ? propertyType.ToSerial(propertyAccess).ConvertToString()
                    : GetQueryParameterStringExpression(propertyType, propertyAccess, property.SerializationFormat);

                MethodBodyStatement appendStatement =
                    uri.AppendQuery(Literal(property.WireInfo!.SerializedName), convertedValue, true).Terminate();

                if (!property.WireInfo.IsRequired ||
                    propertyType.IsNullable ||
                    (propertyType is { IsValueType: false, IsFrameworkType: true } && propertyType.FrameworkType != typeof(string)))
                {
                    appendStatement = BuildQueryOrHeaderOrPathParameterNullCheck(propertyType, propertyAccess, appendStatement);
                }

                statements.Add(appendStatement);
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

        private IReadOnlyList<MethodBodyStatement> AppendPathParameters(ScopedApi uri, InputOperation operation, ParameterProviderMap paramMap)
        {
            Dictionary<string, InputParameter> inputParamMap = operation.Parameters.ToDictionary(p => p.SerializedName);
            List<MethodBodyStatement> statements = new(operation.Parameters.Count);

            // Only process operation.Uri segments that come AFTER the endpoint parameter
            int uriOffset = GetUriOffset(operation.Uri);
            if (uriOffset < operation.Uri.Length)
            {
                AddUriSegments(operation.Uri, uriOffset, uri, statements, inputParamMap, paramMap, operation);
            }

            // Process operation.Path if it exists and is different from operation.Uri
            if (!string.IsNullOrEmpty(operation.Path) && operation.Path != operation.Uri)
            {
                AddUriSegments(operation.Path, 0, uri, statements, inputParamMap, paramMap, operation);
            }

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
            ParameterProviderMap paramMap,
            InputOperation operation)
        {
            var pathSpan = segments.AsSpan().Slice(offset);
            while (pathSpan.Length > 0)
            {
                var paramIndex = pathSpan.IndexOf('{');
                if (paramIndex < 0)
                {
                    AppendLiteralSegment(uri, pathSpan.ToString(), statements);
                    break;
                }

                var path = pathSpan.Slice(0, paramIndex);
                pathSpan = pathSpan.Slice(paramIndex + 1);
                var paramEndIndex = pathSpan.IndexOf('}');
                var paramName = pathSpan.Slice(0, paramEndIndex).ToString();

                /* An optional path parameter that is null must not leave a dangling
                 * path separator behind. For example "/foo/{bar}/{baz}" with an absent
                 * optional "baz" should produce "/foo/{bar}", not "/foo/{bar}/". When the
                 * upcoming parameter is optional, defer the trailing '/' of the preceding
                 * literal so it is only written together with the parameter value inside
                 * the null check below.
                 */
                bool hasPathOrEndpointParam = inputParamMap.TryGetValue(paramName, out var pathParamForGuard)
                    && pathParamForGuard is InputPathParameter or InputEndpointParameter;
                bool willEmitNullGuard = hasPathOrEndpointParam
                    && (pathParamForGuard!.IsRequired == false || pathParamForGuard.Type is InputNullableType);
                var pathLiteral = path.ToString();
                bool separatorDeferred = false;
                if (pathLiteral.EndsWith('/')
                    && willEmitNullGuard)
                {
                    pathLiteral = pathLiteral.Substring(0, pathLiteral.Length - 1);
                    separatorDeferred = true;
                }
                AppendLiteralSegment(uri, pathLiteral, statements);
                /* when the parameter is in operation.uri, it is client parameter
                 * It is not operation parameter and not in inputParamHash list.
                 */
                var isClientParameter = ClientProvider.ClientParameters.Any(p => string.Equals(p.Name, paramName, StringComparison.OrdinalIgnoreCase))
                    || _inputClient.Parameters.Any(p => p is InputMethodParameter { ParamAlias: string alias } && string.Equals(alias, paramName, StringComparison.OrdinalIgnoreCase));
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
                string? format = serializationFormat?.ToFormatSpecifier();
                ValueExpression[] toStringParams = format is null ? [] : [Literal(format)];
                InputPathParameter? inputPathParameter = inputParam as InputPathParameter;
                bool escape = !inputPathParameter?.SkipUrlEncoding ?? true;
                if (type?.OutputType.IsCollection == true)
                {
                    MethodBodyStatement collectionStatement = uri.AppendPathDelimited(valueExpression, GetFormatEnumValue(serializationFormat), escape).Terminate();
                    if (willEmitNullGuard)
                    {
                        bool shouldPrependWithPathSeparator = separatorDeferred || (path.Length > 0 && path[^1] != '/');
                        List<MethodBodyStatement> appendPathStatements = shouldPrependWithPathSeparator
                            ? [uri.AppendPath(Literal("/"), false).Terminate(), collectionStatement]
                            : [collectionStatement];
                        collectionStatement = BuildQueryOrHeaderOrPathParameterNullCheck(
                            type,
                            valueExpression,
                            appendPathStatements);
                    }
                    statements.Add(collectionStatement);
                }
                else
                {
                    var nullCheckExpression = valueExpression;
                    if (type is { IsNullable: true, IsValueType: true, IsEnum: false })
                    {
                        valueExpression = willEmitNullGuard
                            ? valueExpression.Property(nameof(Nullable<int>.Value))
                            : valueExpression.NullConditional();
                    }
                    else if (type is { IsNullable: true, IsEnum: true } && willEmitNullGuard && paramMap.TryGetValue(inputParam?.Name ?? paramName, out var enumParamProvider))
                    {
                        ValueExpression rawEnumVariable = enumParamProvider.Field is null ? enumParamProvider : enumParamProvider.Field;
                        nullCheckExpression = rawEnumVariable;
                        valueExpression = type.ToSerial(rawEnumVariable.Property(nameof(Nullable<int>.Value)));
                    }
                    valueExpression = type?.Equals(typeof(string)) == true || type?.IsEnum == true
                        ? valueExpression
                        : valueExpression.Invoke(nameof(ToString), toStringParams);
                    MethodBodyStatement statement;
                    if (willEmitNullGuard)
                    {
                        bool shouldPrependWithPathSeparator = separatorDeferred || (path.Length > 0 && path[^1] != '/');
                        List<MethodBodyStatement> appendPathStatements = shouldPrependWithPathSeparator
                            ? [uri.AppendPath(Literal("/"), false).Terminate(), uri.AppendPath(valueExpression, escape).Terminate()]
                            : [uri.AppendPath(valueExpression, escape).Terminate()];
                        statement = BuildQueryOrHeaderOrPathParameterNullCheck(
                            type,
                            nullCheckExpression,
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

        private static void AppendLiteralSegment(ScopedApi uri, string literal, List<MethodBodyStatement> statements)
        {
            var queryIndex = literal.IndexOf('?');
            if (queryIndex < 0)
            {
                // No query string, just append as path
                if (literal.Length > 0)
                {
                    statements.Add(uri.AppendPath(Literal(literal), false).Terminate());
                }
                return;
            }

            // Append the path portion (before ?)
            var pathPart = literal.Substring(0, queryIndex);
            if (pathPart.Length > 0)
            {
                statements.Add(uri.AppendPath(Literal(pathPart), false).Terminate());
            }

            // Parse and append query parameters (after ?)
            var queryPart = literal.Substring(queryIndex + 1);
            if (queryPart.Length > 0)
            {
                var queryParams = queryPart.Split('&');
                foreach (var param in queryParams)
                {
                    var eqIndex = param.IndexOf('=');
                    if (eqIndex > 0)
                    {
                        var name = param.Substring(0, eqIndex);
                        var value = param.Substring(eqIndex + 1);
                        statements.Add(uri.AppendQuery(Literal(name), Literal(value), true).Terminate());
                    }
                }
            }
        }

        private void GetParamInfo(ParameterProviderMap paramMap, InputOperation operation, InputParameter inputParam, out CSharpType? type, out SerializationFormat? serializationFormat, out ValueExpression? valueExpression)
        {
            type = IsContentTypeParameter(inputParam, includeInputHeaderParameter: false)
                ? null
                : ScmCodeModelGenerator.Instance.TypeFactory.CreateCSharpType(inputParam.Type);
            serializationFormat = null;

            if (inputParam.IsApiVersion && ClientProvider.IsMultiServiceClient)
            {
                var apiVersionField = ClientProvider.GetApiVersionFieldForService(operation.Namespace);
                if (apiVersionField != null)
                {
                    type = apiVersionField.Type;
                    serializationFormat = apiVersionField.WireInfo?.SerializationFormat;
                    valueExpression = apiVersionField;
                    return;
                }
            }

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

        private static string? GetPageSizeParameterName(InputPagingServiceMethod? pagingServiceMethod)
        {
            return pagingServiceMethod?.PagingMetadata?.PageSizeParameterSegments?.Count > 0
                ? pagingServiceMethod.PagingMetadata.PageSizeParameterSegments.Last()
                : null;
        }

        private static void UpdateParameterNameWithBackCompat(InputParameter inputParameter, string proposedName, TypeProvider backCompatProvider, InputServiceMethod? serviceMethod = null)
        {
            // Look up the parameter's original (spec) name in the previous contract.
            // When a service method is supplied, scope the search to methods whose name matches
            // the current service method (allowing for sync/async pairing) so that a common
            // parameter name (e.g. "id") on multiple methods can't cross-match.
            var lastContractMethods = backCompatProvider.LastContractView?.Methods;
            IEnumerable<MethodProvider>? scopedMethods = lastContractMethods;
            if (lastContractMethods != null && serviceMethod != null)
            {
                var serviceMethodName = serviceMethod.Name;
                scopedMethods = lastContractMethods.Where(m =>
                    string.Equals(m.Signature.Name, serviceMethodName, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(m.Signature.Name, serviceMethodName + "Async", StringComparison.OrdinalIgnoreCase));
            }

            // Check if the original wire name exists in LastContractView for backward compatibility.
            var existingParam = scopedMethods
                ?.SelectMany(method => method.Signature.Parameters)
                .FirstOrDefault(p => string.Equals(p.Name, inputParameter.OriginalName, StringComparison.OrdinalIgnoreCase))
                ?.Name;

            if (existingParam != null)
            {
                // Preserve the exact name (including casing) from the previous contract for backward compatibility
                if (!string.Equals(proposedName, existingParam, StringComparison.Ordinal))
                {
                    CodeModelGenerator.Instance.Emitter.Debug(
                        $"Preserved parameter name '{existingParam}' on '{backCompatProvider.Name}' from last contract (instead of '{proposedName}').",
                        BackCompatibilityChangeCategory.ParameterNamePreserved);
                }
                proposedName = existingParam;
            }

            // Use the updated name
            if (!string.Equals(inputParameter.Name, proposedName, StringComparison.Ordinal))
            {
                inputParameter.Update(name: proposedName);
            }
        }

        private static bool ShouldUpdateReinjectedParameter(InputParameter inputParameter, InputPagingServiceMethod? pagingServiceMethod)
        {
            // Check if this is an API version parameter
            if (inputParameter.IsApiVersion)
            {
                return true;
            }

            // Check if this is a max page size parameter
            var pageSizeParameterName = GetPageSizeParameterName(pagingServiceMethod);
            if (pageSizeParameterName != null && string.Equals(inputParameter.OriginalName, pageSizeParameterName, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }

        private static List<int> GetSuccessStatusCodes(InputOperation operation)
        {
            HashSet<int> statusCodes = [];
            foreach (var response in operation.Responses)
            {
                if (response.IsErrorResponse)
                {
                    continue;
                }

                foreach (var statusCode in response.StatusCodes)
                {
                    if (statusCode >= 200 && statusCode < 400)
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

        internal static List<ParameterProvider> GetMethodParameters(
            InputServiceMethod serviceMethod,
            ScmMethodKind methodType,
            ClientProvider client)
        {
            SortedList<int, ParameterProvider> sortedParams = [];
            int path = 0;
            int required = 100;
            int bodyRequired = 200;
            int bodyOptional = 300;
            int contentType = 350;
            int optional = 400;

            var operation = serviceMethod.Operation;
            // Convenience methods use the service method parameters. The protocol method does too when
            // @@override grouped the operation's parameters into an options bag, so both surfaces share
            // the same shape (https://github.com/microsoft/typespec/issues/11214).
            var inputParameters = methodType is ScmMethodKind.Convenience
                || (methodType is ScmMethodKind.Protocol && ShouldGroupProtocolParameters(serviceMethod))
                ? serviceMethod.Parameters
                : operation.Parameters;

            var pageSizeParameterName = GetPageSizeParameterName(serviceMethod as InputPagingServiceMethod);

            ModelProvider? spreadSource = null;
            if (methodType == ScmMethodKind.Convenience)
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

                if (inputParam.IsApiVersion && (inputParam.DefaultValue != null || client.IsMultiServiceClient))
                {
                    continue;
                }

                // For paging operations, handle parameter name corrections with backward compatibility
                if (serviceMethod is InputPagingServiceMethod)
                {
                    // Rename "top" parameter to "maxCount" (with backward compatibility).
                    if (string.Equals(inputParam.OriginalName, TopParameterName, StringComparison.OrdinalIgnoreCase))
                    {
                        UpdateParameterNameWithBackCompat(inputParam, MaxCountParameterName, client.BackCompatProvider, serviceMethod);
                    }

                    // Ensure page size parameter uses the correct casing (with backward compatibility)
                    if (pageSizeParameterName != null && string.Equals(inputParam.OriginalName, pageSizeParameterName, StringComparison.OrdinalIgnoreCase))
                    {
                        var updatedPageSizeParameterName = pageSizeParameterName.Equals(MaxPageSizeParameterName, StringComparison.OrdinalIgnoreCase)
                            ? MaxPageSizeParameterName
                            : pageSizeParameterName;
                        // For page size parameters, normalize badly-cased "maxpagesize" variants to proper camelCase, but always
                        // respect backcompat.
                        UpdateParameterNameWithBackCompat(inputParam, updatedPageSizeParameterName, client.BackCompatProvider, serviceMethod);
                    }
                }

                // For every parameter, preserve a previously-published parameter name when the
                // last contract has a matching parameter (matched by spec/original name). This
                // generalizes back-compat name preservation beyond the paging-specific renames
                // above so that any rename emitted by the generator falls back to the prior name
                // when one was already published.
                UpdateParameterNameWithBackCompat(inputParam, inputParam.Name, client.BackCompatProvider, serviceMethod);

                ParameterProvider? parameter = ScmCodeModelGenerator.Instance.TypeFactory.CreateParameter(inputParam)?.ToPublicInputParameter();
                if (parameter is null)
                {
                    continue;
                }

                if (methodType is ScmMethodKind.Protocol or ScmMethodKind.CreateRequest)
                {
                    if (inputParam is InputBodyParameter || inputParam is InputMethodParameter { Location: InputRequestLocation.Body })
                    {
                        if (methodType == ScmMethodKind.CreateRequest)
                        {
                            parameter = ScmKnownParameters.CreateRequestContent(inputParam);
                        }
                        else
                        {
                            parameter = ScmKnownParameters.CreateRequestContent(inputParam,
                                optional: parameter.DefaultValue != null);
                        }
                    }
                    else
                    {
                        if (IsContentTypeParameter(inputParam))
                        {
                            parameter.Type = new CSharpType(typeof(string), isNullable: !inputParam.IsRequired);
                            parameter.Validation = inputParam.IsRequired
                                ? ParameterValidationType.AssertNotNullOrEmpty
                                : ParameterValidationType.None;
                        }
                        else
                        {
                            parameter.Type = parameter.Type.IsEnum ? parameter.Type.UnderlyingEnumType : parameter.Type;
                        }
                    }
                }
                else if (methodType is ScmMethodKind.Convenience &&
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
                        if (IsContentTypeParameter(inputParam)
                            && !HasContentTypeBeforeBodyInLastContract(serviceMethod, client.BackCompatProvider))
                        {
                            sortedParams.Add(contentType++, parameter);
                        }
                        else if (parameter.DefaultValue == null)
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

            if (operation.IsMultipartFormData
                && !(methodType is ScmMethodKind.Convenience && HasLiteralContentTypeHeader(operation)))
            {
                bool bodyIsRequired = methodType == ScmMethodKind.Protocol
                    && operation.Parameters.OfType<InputBodyParameter>().Any(p => p.IsRequired);
                sortedParams.Add(contentType++, bodyIsRequired ? ScmKnownParameters.ContentType : ScmKnownParameters.OptionalContentType);
            }

            if (methodType == ScmMethodKind.CreateRequest)
            {
                // All the parameters should be required for the CreateRequest method
                foreach (var parameter in sortedParams.Values)
                {
                    parameter.DefaultValue = null;
                }
            }

            return [.. sortedParams.Values];
        }

        /// <summary>
        /// Determines whether the protocol method should adopt the grouped (options bag) parameter shape
        /// produced by <c>@@override</c>. Grouping is skipped when the request body itself was folded into
        /// the bag, because the protocol method must keep exposing the body as raw request content.
        /// </summary>
        internal static bool ShouldGroupProtocolParameters(InputServiceMethod serviceMethod)
        {
            bool hasGroupedParameter = false;
            foreach (var parameter in serviceMethod.Operation.Parameters)
            {
                if (parameter.MethodParameterSegments is not { Count: > 1 } segments)
                {
                    continue;
                }

                // The bag is (or contains) the request body, so the protocol method has to stay flattened
                // to keep accepting a raw payload.
                if (parameter is InputBodyParameter
                    || segments[0] is InputMethodParameter { Location: InputRequestLocation.Body })
                {
                    return false;
                }

                if (!SegmentsPreserveRequiredness(parameter, segments))
                {
                    return false;
                }

                hasGroupedParameter = true;
            }

            return hasGroupedParameter;
        }

        /// <summary>
        /// A required wire parameter must map to a required property so the bag's constructor forces callers
        /// to supply it. TCGC does not validate this, and when it does not hold, grouping the protocol method
        /// would silently drop the compile-time guarantee that the flattened signature provides.
        /// </summary>
        private static bool SegmentsPreserveRequiredness(InputParameter parameter, IReadOnlyList<InputMethodParameter> segments)
        {
            if (!parameter.IsRequired)
            {
                return true;
            }

            var currentType = segments[0].Type;
            for (int i = 1; i < segments.Count; i++)
            {
                if (currentType is not InputModelType model)
                {
                    return false;
                }

                var property = FindPropertyInHierarchy(model, segments[i].Name);
                if (property is null || !property.IsRequired)
                {
                    return false;
                }

                currentType = property.Type;
            }

            return true;
        }

        private static InputModelProperty? FindPropertyInHierarchy(InputModelType model, string name)
        {
            for (var current = model; current != null; current = current.BaseModel)
            {
                foreach (var property in current.Properties)
                {
                    if (property.SerializedName == name
                        || string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                    {
                        return property;
                    }
                }
            }

            return null;
        }

        private static bool HasLiteralContentTypeHeader(InputOperation operation)
        {
            foreach (var p in operation.Parameters)
            {
                if (p is InputHeaderParameter { IsContentType: true } && p.Type is InputLiteralType)
                {
                    return true;
                }
            }
            return false;
        }

        private static bool IsContentTypeParameter(InputParameter parameter, bool includeInputHeaderParameter = true) =>
            includeInputHeaderParameter && parameter is InputHeaderParameter { IsContentType: true } ||
                parameter is InputMethodParameter { Location: InputRequestLocation.Header } &&
                string.Equals(parameter.SerializedName, "Content-Type", StringComparison.OrdinalIgnoreCase);

        /// <summary>
        /// Checks if the last contract view contains a method matching the given name where
        /// a "contentType" parameter appears before the body parameter.
        /// If so, we should preserve that ordering for backward compatibility.
        /// </summary>
        private static bool HasContentTypeBeforeBodyInLastContract(InputServiceMethod serviceMethod, TypeProvider backCompatProvider) =>
            GetContentTypeOrderInLastContract(serviceMethod, backCompatProvider) == LastContractContentTypeOrder.BeforeBody;

        private static LastContractContentTypeOrder GetContentTypeOrderInLastContract(
            InputServiceMethod serviceMethod,
            TypeProvider backCompatProvider)
        {
            const string contentTypeParamName = "contentType";

            var lastContractMethods = backCompatProvider.LastContractView?.Methods;
            if (lastContractMethods == null || lastContractMethods.Count == 0)
            {
                return LastContractContentTypeOrder.NoMatchingMethod;
            }

            var syncMethodName = serviceMethod.Name;
            var asyncMethodName = serviceMethod.Name + "Async";
            var bodyParameterNames = GetBodyParameterNames(serviceMethod);
            var matchedMethod = false;
            var foundAfterBody = false;

            foreach (var method in lastContractMethods)
            {
                if (!string.Equals(method.Signature.Name, syncMethodName, StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(method.Signature.Name, asyncMethodName, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                matchedMethod = true;
                int contentTypeIndex = -1;
                int bodyIndex = -1;
                for (int i = 0; i < method.Signature.Parameters.Count; i++)
                {
                    var param = method.Signature.Parameters[i];
                    if (string.Equals(param.Name, contentTypeParamName, StringComparison.OrdinalIgnoreCase))
                    {
                        contentTypeIndex = i;
                    }
                    else if (IsLastContractBodyParameter(param, bodyParameterNames))
                    {
                        bodyIndex = i;
                    }

                    if (contentTypeIndex >= 0 && bodyIndex >= 0)
                    {
                        break;
                    }
                }

                if (contentTypeIndex >= 0 && bodyIndex >= 0 && contentTypeIndex < bodyIndex)
                {
                    return LastContractContentTypeOrder.BeforeBody;
                }

                if (contentTypeIndex >= 0 && bodyIndex >= 0)
                {
                    foundAfterBody = true;
                }
            }

            if (foundAfterBody)
            {
                return LastContractContentTypeOrder.AfterBody;
            }

            return matchedMethod
                ? LastContractContentTypeOrder.MatchingMethodWithoutOrder
                : LastContractContentTypeOrder.NoMatchingMethod;
        }

        private enum LastContractContentTypeOrder
        {
            NoMatchingMethod,
            MatchingMethodWithoutOrder,
            BeforeBody,
            AfterBody
        }

        private static HashSet<string> GetBodyParameterNames(InputServiceMethod serviceMethod)
        {
            var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var parameter in serviceMethod.Parameters)
            {
                if (parameter.Location == InputRequestLocation.Body)
                {
                    names.Add(parameter.Name);
                }
            }

            foreach (var parameter in serviceMethod.Operation.Parameters)
            {
                if (parameter is InputBodyParameter)
                {
                    names.Add(parameter.Name);
                }
            }

            return names;
        }

        private static bool IsLastContractBodyParameter(ParameterProvider parameter, HashSet<string> bodyParameterNames)
        {
            if (parameter.InputParameter is InputBodyParameter ||
                parameter.Location == ParameterLocation.Body ||
                bodyParameterNames.Contains(parameter.Name))
            {
                return true;
            }

            if (string.Equals(parameter.Name, ContentParameterName, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return false;
        }

        internal static InputModelType GetSpreadParameterModel(InputParameter inputParam)
        {
            if (inputParam.Type is InputModelType model)
            {
                return model;
            }

            throw new InvalidOperationException($"inputParam `{inputParam.Name}` is `Spread` but not a model type");
        }

        /// <summary>
        /// Maps names used by the input model to the parameters of the generated method. Names coming from the input
        /// model (wire names, original names and aliases) take precedence over the normalized C# names of the generated
        /// parameters, because normalization can produce a C# name that collides with the raw name of another parameter.
        /// The generated names are kept as a fallback for lookups that have no corresponding input parameter, such as
        /// URI template segments and client parameters like the endpoint.
        /// </summary>
        private sealed class ParameterProviderMap
        {
            private readonly Dictionary<string, ParameterProvider> _inputExact = new(StringComparer.Ordinal);
            private readonly Dictionary<string, ParameterProvider> _inputIgnoreCase = new(StringComparer.OrdinalIgnoreCase);
            private readonly Dictionary<string, ParameterProvider> _generatedExact = new(StringComparer.Ordinal);
            private readonly Dictionary<string, ParameterProvider> _generatedIgnoreCase = new(StringComparer.OrdinalIgnoreCase);
            private readonly bool _allowCaseInsensitiveFallback;

            /// <param name="allowCaseInsensitiveFallback">
            /// Whether lookups may fall back to a case-insensitive match. This must be disabled for maps that hold a
            /// subset of the operation's parameters, such as the parameters reinjected into a next link request.
            /// Otherwise a parameter that was left out of the subset would resolve to another parameter whose name
            /// differs only by casing.
            /// </param>
            public ParameterProviderMap(bool allowCaseInsensitiveFallback = true)
            {
                _allowCaseInsensitiveFallback = allowCaseInsensitiveFallback;
            }

            public int Count => _inputExact.Count + _generatedExact.Count;

            public ParameterProvider this[string name]
            {
                get => TryGetValue(name, out var parameter)
                    ? parameter
                    : throw new KeyNotFoundException($"No parameter named '{name}' was found.");
                set => SetInputName(name, value);
            }

            /// <summary>
            /// Registers an input model name if it is not already mapped. The first registration wins so that the
            /// parameter's own name takes precedence over its original name and alias.
            /// </summary>
            public bool AddInputName(string name, ParameterProvider parameter)
            {
                var added = _inputExact.TryAdd(name, parameter);
                _inputIgnoreCase.TryAdd(name, parameter);
                return added;
            }

            public void SetInputName(string name, ParameterProvider parameter)
            {
                _inputExact[name] = parameter;
                _inputIgnoreCase[name] = parameter;
            }

            public void SetGeneratedName(string name, ParameterProvider parameter)
            {
                _generatedExact[name] = parameter;
                _generatedIgnoreCase[name] = parameter;
            }

            public bool ContainsExactInputName(string name) => _inputExact.ContainsKey(name);

            public bool TryGetValue(string name, [NotNullWhen(true)] out ParameterProvider? parameter)
            {
                if (_inputExact.TryGetValue(name, out parameter) ||
                    _generatedExact.TryGetValue(name, out parameter))
                {
                    return true;
                }

                if (!_allowCaseInsensitiveFallback)
                {
                    parameter = null;
                    return false;
                }

                return _inputIgnoreCase.TryGetValue(name, out parameter) ||
                    _generatedIgnoreCase.TryGetValue(name, out parameter);
            }
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
